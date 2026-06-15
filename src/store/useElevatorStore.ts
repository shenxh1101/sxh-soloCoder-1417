import { create } from 'zustand';
import type { 
  AppState, 
  Elevator, 
  HallCall, 
  Passenger, 
  SchedulingStrategy, 
  PassengerIntensity,
  CarCall
} from '../types';
import { createElevator, updateElevator, addTargetFloor, startClosingDoor, updateElevatorLoad } from '../logic/elevatorController';
import { getScheduler } from '../logic/scheduler';
import { generatePassenger, getSpawnInterval, resetCounters, createManualHallCall } from '../logic/passengerSimulator';
import { createInitialStatistics, updateStatistics, incrementStartStop } from '../logic/statistics';
import { ELEVATOR_CONFIG } from '../config/constants';

interface ElevatorStore extends AppState {
  lastFrameTime: number;
  lastSpawnTime: number;
  doorOpenTimers: Record<string, number>;
  
  initialize: () => void;
  reset: () => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  setStrategy: (strategy: SchedulingStrategy) => void;
  setIntensity: (intensity: PassengerIntensity) => void;
  setSimulationSpeed: (speed: number) => void;
  setPeakDirection: (direction: 'up' | 'down') => void;
  
  addHallCall: (floor: number, direction: 'up' | 'down') => void;
  addCarCall: (carCall: CarCall) => void;
  
  update: (currentTime: number) => void;
  
  processPassengerBoarding: (elevatorId: string) => void;
  processPassengerAlighting: (elevatorId: string) => void;
  markHallCallAsPickedUp: (hallCallId: number) => void;
  markTripAsCompleted: (passengerId: number) => void;
  getWaitingPassengersForElevator: (elevatorId: string, floor: number) => Passenger[];
}

const createInitialState = (): Omit<
  ElevatorStore,
  | 'initialize'
  | 'reset'
  | 'startSimulation'
  | 'pauseSimulation'
  | 'resumeSimulation'
  | 'setStrategy'
  | 'setIntensity'
  | 'setSimulationSpeed'
  | 'setPeakDirection'
  | 'addHallCall'
  | 'addCarCall'
  | 'update'
  | 'processPassengerBoarding'
  | 'processPassengerAlighting'
  | 'markHallCallAsPickedUp'
  | 'markTripAsCompleted'
  | 'getWaitingPassengersForElevator'
> => {
  resetCounters();
  return {
    elevators: [
      createElevator('A', 'A梯'),
      createElevator('B', 'B梯'),
    ],
    hallCalls: [],
    passengers: [],
    statistics: createInitialStatistics(),
    strategy: 'nearest',
    intensity: 'medium',
    isRunning: false,
    isPaused: false,
    simulationSpeed: 1,
    peakDirection: 'up',
    lastFrameTime: 0,
    lastSpawnTime: 0,
    doorOpenTimers: {},
  };
};

export const useElevatorStore = create<ElevatorStore>((set, get) => ({
  ...createInitialState(),
  
  initialize: () => {
    set(createInitialState());
  },
  
  reset: () => {
    set(createInitialState());
  },
  
  startSimulation: () => {
    set({ 
      isRunning: true, 
      isPaused: false,
      lastFrameTime: performance.now(),
      lastSpawnTime: performance.now(),
    });
  },
  
  pauseSimulation: () => {
    set({ isPaused: true });
  },
  
  resumeSimulation: () => {
    set({ 
      isPaused: false,
      lastFrameTime: performance.now(),
    });
  },
  
  setStrategy: (strategy: SchedulingStrategy) => {
    set({ strategy });
  },
  
  setIntensity: (intensity: PassengerIntensity) => {
    set({ intensity });
  },
  
  setSimulationSpeed: (speed: number) => {
    set({ simulationSpeed: speed });
  },
  
  setPeakDirection: (direction: 'up' | 'down') => {
    set({ peakDirection: direction });
  },
  
  addHallCall: (floor: number, direction: 'up' | 'down') => {
    const state = get();
    const existingCall = state.hallCalls.find(
      c => c.fromFloor === floor && c.direction === direction && !c.pickedUp
    );
    
    if (existingCall) return;
    
    const hallCall = createManualHallCall(floor, direction);
    const scheduler = getScheduler(state.strategy);
    const assignedElevatorId = scheduler.selectElevator(
      hallCall, 
      state.elevators, 
      [...state.hallCalls, hallCall],
      state.peakDirection
    );
    
    if (assignedElevatorId) {
      hallCall.assignedElevator = assignedElevatorId;
      set(state => {
        const elevator = state.elevators.find(e => e.id === assignedElevatorId)!;
        const updatedElevator = addTargetFloor(elevator, floor);
        return {
          hallCalls: [...state.hallCalls, hallCall],
          elevators: state.elevators.map(e => 
            e.id === assignedElevatorId ? updatedElevator : e
          ),
        };
      });
    } else {
      set(state => ({
        hallCalls: [...state.hallCalls, hallCall],
      }));
    }
  },
  
  addCarCall: ({ elevatorId, floor }: CarCall) => {
    set(state => {
      const elevator = state.elevators.find(e => e.id === elevatorId);
      if (!elevator) return state;
      
      const updatedElevator = addTargetFloor(elevator, floor);
      return {
        elevators: state.elevators.map(e => 
          e.id === elevatorId ? updatedElevator : e
        ),
      };
    });
  },
  
  processPassengerBoarding: (elevatorId: string) => {
    set(state => {
      const elevator = state.elevators.find(e => e.id === elevatorId);
      if (!elevator || !elevator.doorOpen) return state;
      
      const waitingPassengers = state.passengers.filter(
        p => p.state === 'waiting' && 
             p.fromFloor === elevator.currentFloor &&
             (p.elevatorId === elevatorId || p.elevatorId === null)
      );
      
      const hallCallsForFloor = state.hallCalls.filter(
        c => c.fromFloor === elevator.currentFloor && 
             !c.pickedUp &&
             c.assignedElevator === elevatorId
      );
      
      const now = Date.now();
      let newLoad = elevator.load;
      const boardingPassengers: Passenger[] = [];
      const pickedUpCallIds: number[] = [];
      
      for (const passenger of waitingPassengers) {
        if (newLoad + passenger.weight <= elevator.capacity) {
          const direction = passenger.toFloor > passenger.fromFloor ? 'up' : 'down';
          const matchingCall = hallCallsForFloor.find(c => 
            c.direction === direction && c.passengerId === passenger.id
          );
          
          const hasMatchingCall = matchingCall !== undefined;
          const isManualCall = hallCallsForFloor.length === 0 && passenger.elevatorId === null;
          
          if (hasMatchingCall || isManualCall) {
            newLoad += passenger.weight;
            boardingPassengers.push({
              ...passenger,
              state: 'riding',
              elevatorId,
              boardedAt: now,
            });
            if (matchingCall) {
              pickedUpCallIds.push(matchingCall.id);
            }
          }
        }
      }
      
      const updatedPassengers = state.passengers.map(p => {
        const boarding = boardingPassengers.find(bp => bp.id === p.id);
        return boarding || p;
      });
      
      const updatedHallCalls = state.hallCalls.map(c => {
        if (pickedUpCallIds.includes(c.id)) {
          return { ...c, pickedUp: true, pickedUpTime: now };
        }
        return c;
      });
      
      let updatedElevator = {
        ...elevator,
        load: newLoad,
        passengers: [...elevator.passengers, ...boardingPassengers],
      };
      
      for (const passenger of boardingPassengers) {
        updatedElevator = addTargetFloor(updatedElevator, passenger.toFloor);
      }
      
      return {
        elevators: state.elevators.map(e => 
          e.id === elevatorId ? updatedElevator : e
        ),
        passengers: updatedPassengers,
        hallCalls: updatedHallCalls,
      };
    });
  },
  
  processPassengerAlighting: (elevatorId: string) => {
    set(state => {
      const elevator = state.elevators.find(e => e.id === elevatorId);
      if (!elevator || !elevator.doorOpen) return state;
      
      const now = Date.now();
      const alightingPassengers = elevator.passengers.filter(
        p => p.toFloor === elevator.currentFloor
      );
      
      const remainingPassengers = elevator.passengers.filter(
        p => p.toFloor !== elevator.currentFloor
      );
      
      const completedPassengerIds = alightingPassengers.map(p => p.id);
      
      const updatedPassengers = state.passengers.map(p => {
        if (completedPassengerIds.includes(p.id)) {
          return { ...p, state: 'completed' as const, exitedAt: now };
        }
        return p;
      });
      
      const updatedHallCalls = state.hallCalls.map(c => {
        if (c.passengerId !== null && completedPassengerIds.includes(c.passengerId) && !c.resolved) {
          return { ...c, resolved: true, resolvedTime: now };
        }
        return c;
      });
      
      const newLoad = remainingPassengers.reduce((sum, p) => sum + p.weight, 0);
      
      return {
        elevators: state.elevators.map(e => 
          e.id === elevatorId 
            ? { ...e, passengers: remainingPassengers, load: newLoad }
            : e
        ),
        passengers: updatedPassengers,
        hallCalls: updatedHallCalls,
      };
    });
  },
  
  markHallCallAsPickedUp: (hallCallId: number) => {
    set(state => ({
      hallCalls: state.hallCalls.map(c => 
        c.id === hallCallId 
          ? { ...c, pickedUp: true, pickedUpTime: Date.now() } 
          : c
      ),
    }));
  },
  
  markTripAsCompleted: (passengerId: number) => {
    set(state => {
      const now = Date.now();
      return {
        passengers: state.passengers.map(p => 
          p.id === passengerId 
            ? { ...p, state: 'completed' as const, exitedAt: now } 
            : p
        ),
        hallCalls: state.hallCalls.map(c => 
          c.passengerId === passengerId && !c.resolved
            ? { ...c, resolved: true, resolvedTime: now }
            : c
        ),
      };
    });
  },
  
  getWaitingPassengersForElevator: (elevatorId: string, floor: number) => {
    const state = get();
    return state.passengers.filter(
      p => p.state === 'waiting' && 
           p.fromFloor === floor &&
           (p.elevatorId === elevatorId || p.elevatorId === null)
    );
  },
  
  update: (currentTime: number) => {
    const state = get();
    if (!state.isRunning || state.isPaused) return;
    
    const deltaTime = currentTime - state.lastFrameTime;
    
    if (state.isRunning && !state.isPaused) {
      const spawnInterval = getSpawnInterval(state.intensity);
      if (currentTime - state.lastSpawnTime > spawnInterval / state.simulationSpeed) {
        const { passenger, hallCall } = generatePassenger();
        const scheduler = getScheduler(state.strategy);
        const assignedElevatorId = scheduler.selectElevator(
          hallCall,
          state.elevators,
          [...state.hallCalls, hallCall],
          state.peakDirection
        );
        
        if (assignedElevatorId) {
          hallCall.assignedElevator = assignedElevatorId;
          passenger.elevatorId = assignedElevatorId;
          
          set(state => {
            const elevator = state.elevators.find(e => e.id === assignedElevatorId)!;
            const updatedElevator = addTargetFloor(elevator, hallCall.fromFloor);
            return {
              passengers: [...state.passengers, passenger],
              hallCalls: [...state.hallCalls, hallCall],
              elevators: state.elevators.map(e => 
                e.id === assignedElevatorId ? updatedElevator : e
              ),
              lastSpawnTime: currentTime,
            };
          });
        } else {
          set(state => ({
            passengers: [...state.passengers, passenger],
            hallCalls: [...state.hallCalls, hallCall],
            lastSpawnTime: currentTime,
          }));
        }
      }
    }
    
    set(state => {
      let newElevators = [...state.elevators];
      let newDoorOpenTimers = { ...state.doorOpenTimers };
      let newStatistics = { ...state.statistics };
      
      for (let i = 0; i < newElevators.length; i++) {
        const elevator = newElevators[i];
        const result = updateElevator(elevator, deltaTime, state.simulationSpeed);
        
        if (result.arrived) {
          newStatistics = incrementStartStop(newStatistics, elevator.id);
        }
        
        if (result.doorEvent === 'opened') {
          newDoorOpenTimers[elevator.id] = currentTime;
        }
        
        if (result.doorEvent === 'closed') {
          delete newDoorOpenTimers[elevator.id];
        }
        
        newElevators[i] = result.elevator;
      }
      
      for (const elevatorId in newDoorOpenTimers) {
        const openTime = currentTime - newDoorOpenTimers[elevatorId];
        const requiredOpenTime = ELEVATOR_CONFIG.DOOR_OPEN_TIME / state.simulationSpeed;
        
        if (openTime > requiredOpenTime) {
          const idx = newElevators.findIndex(e => e.id === elevatorId);
          if (idx !== -1) {
            newElevators[idx] = startClosingDoor(newElevators[idx]);
          }
        }
      }
      
      const unassignedCalls = state.hallCalls.filter(
        c => !c.assignedElevator && !c.pickedUp
      );
      
      if (unassignedCalls.length > 0) {
        const scheduler = getScheduler(state.strategy);
        for (const call of unassignedCalls) {
          const assignedId = scheduler.selectElevator(
            call,
            newElevators,
            state.hallCalls,
            state.peakDirection
          );
          
          if (assignedId) {
            call.assignedElevator = assignedId;
            const idx = newElevators.findIndex(e => e.id === assignedId);
            if (idx !== -1) {
              newElevators[idx] = addTargetFloor(newElevators[idx], call.fromFloor);
            }
          }
        }
      }
      
      newStatistics = updateStatistics(
        newStatistics,
        state.hallCalls,
        state.passengers,
        deltaTime,
        state.simulationSpeed
      );
      
      return {
        elevators: newElevators,
        doorOpenTimers: newDoorOpenTimers,
        statistics: newStatistics,
        lastFrameTime: currentTime,
      };
    });
  },
}));
