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
import { createElevator, updateElevator, addTargetFloor, startClosingDoor } from '../logic/elevatorController';
import { getScheduler } from '../logic/scheduler';
import { generatePassenger, getSpawnInterval, resetCounters, createManualHallCall } from '../logic/passengerSimulator';
import { createInitialStatistics, updateStatistics, incrementStartStop } from '../logic/statistics';
import { ELEVATOR_CONFIG, BUILDING_CONFIG } from '../config/constants';

interface ElevatorStore extends AppState {
  lastFrameRealTime: number;
  lastSpawnSimTime: number;
  doorOpenSimTimes: Record<string, number>;
  
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
  
  update: (currentRealTime: number) => void;
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
    simulationTimeMs: 0,
    lastFrameRealTime: 0,
    lastSpawnSimTime: 0,
    doorOpenSimTimes: {},
  };
};

function getPeakZone(elevatorId: string, peakDirection: 'up' | 'down'): 'low' | 'high' {
  if (peakDirection === 'up') {
    return elevatorId === 'A' ? 'low' : 'high';
  } else {
    return elevatorId === 'A' ? 'high' : 'low';
  }
}

function isFloorInZone(floor: number, zone: 'low' | 'high'): boolean {
  const midFloor = 2;
  return zone === 'low' ? floor <= midFloor : floor > midFloor;
}

function reassignWaitingPassengers(
  passengers: Passenger[],
  hallCalls: HallCall[],
  elevators: Elevator[],
  strategy: SchedulingStrategy,
  peakDirection: 'up' | 'down',
  simTime: number,
  excludeElevatorId?: string
): { passengers: Passenger[]; hallCalls: HallCall[]; elevators: Elevator[] } {
  let newPassengers = [...passengers];
  let newHallCalls = [...hallCalls];
  let newElevators = [...elevators];
  
  const waitingPassengers = newPassengers.filter(p => p.state === 'waiting');
  
  for (const passenger of waitingPassengers) {
    let passengerCall = newHallCalls.find(
      c => c.passengerId === passenger.id
    );
    
    if (!passengerCall) {
      const direction = passenger.toFloor > passenger.fromFloor ? 'up' : 'down';
      passengerCall = {
        id: Date.now() + Math.random(),
        fromFloor: passenger.fromFloor,
        direction,
        timestamp: simTime,
        assignedElevator: null,
        pickedUp: false,
        pickedUpTime: null,
        resolved: false,
        resolvedTime: null,
        passengerId: passenger.id,
      };
      newHallCalls.push(passengerCall);
    }
    
    if (passengerCall.pickedUp) {
      continue;
    }
    
    const needReassign = 
      !passengerCall.assignedElevator ||
      (excludeElevatorId && passengerCall.assignedElevator === excludeElevatorId);
    
    if (needReassign) {
      passengerCall.assignedElevator = null;
      passenger.elevatorId = null;
      
      const scheduler = getScheduler(strategy);
      const assignedId = scheduler.selectElevator(
        passengerCall,
        newElevators,
        newHallCalls,
        peakDirection
      );
      
      if (assignedId) {
        passengerCall.assignedElevator = assignedId;
        passenger.elevatorId = assignedId;
        const idx = newElevators.findIndex(e => e.id === assignedId);
        if (idx !== -1) {
          newElevators[idx] = addTargetFloor(newElevators[idx], passenger.fromFloor);
        }
      }
    }
  }
  
  return { passengers: newPassengers, hallCalls: newHallCalls, elevators: newElevators };
}

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
      lastFrameRealTime: performance.now(),
    });
  },
  
  pauseSimulation: () => {
    set({ isPaused: true });
  },
  
  resumeSimulation: () => {
    set({ 
      isPaused: false,
      lastFrameRealTime: performance.now(),
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
    
    const existingActiveCall = state.hallCalls.find(
      c => c.fromFloor === floor && c.direction === direction && !c.pickedUp
    );
    
    if (existingActiveCall) return;
    
    const hallCall: HallCall = {
      ...createManualHallCall(floor, direction),
      timestamp: state.simulationTimeMs,
    };
    
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
  
  update: (currentRealTime: number) => {
    const state = get();
    if (!state.isRunning || state.isPaused) return;
    
    const realDeltaMs = currentRealTime - state.lastFrameRealTime;
    if (realDeltaMs <= 0) return;
    
    const simDeltaMs = realDeltaMs * state.simulationSpeed;
    const newSimTime = state.simulationTimeMs + simDeltaMs;
    
    let newElevators = [...state.elevators];
    let newHallCalls = [...state.hallCalls];
    let newPassengers = [...state.passengers];
    let newStatistics = { ...state.statistics };
    let newDoorOpenSimTimes = { ...state.doorOpenSimTimes };
    let newLastSpawnSimTime = state.lastSpawnSimTime;
    
    const spawnInterval = getSpawnInterval(state.intensity);
    if (newSimTime - state.lastSpawnSimTime > spawnInterval) {
      const { passenger, hallCall } = generatePassenger();
      
      passenger.createdAt = newSimTime;
      hallCall.timestamp = newSimTime;
      hallCall.pickedUp = false;
      hallCall.pickedUpTime = null;
      hallCall.resolved = false;
      hallCall.resolvedTime = null;
      
      const scheduler = getScheduler(state.strategy);
      const assignedElevatorId = scheduler.selectElevator(
        hallCall,
        newElevators,
        [...newHallCalls, hallCall],
        state.peakDirection
      );
      
      if (assignedElevatorId) {
        hallCall.assignedElevator = assignedElevatorId;
        passenger.elevatorId = assignedElevatorId;
        
        const idx = newElevators.findIndex(e => e.id === assignedElevatorId);
        if (idx !== -1) {
          newElevators[idx] = addTargetFloor(newElevators[idx], hallCall.fromFloor);
        }
      }
      
      newPassengers.push(passenger);
      newHallCalls.push(hallCall);
      newLastSpawnSimTime = newSimTime;
    }
    
    for (let i = 0; i < newElevators.length; i++) {
      const elevator = newElevators[i];
      const result = updateElevator(elevator, realDeltaMs, state.simulationSpeed);
      
      if (result.arrived) {
        newStatistics = incrementStartStop(newStatistics, elevator.id);
      }
      
      if (result.doorEvent === 'opened') {
        newDoorOpenSimTimes[elevator.id] = newSimTime;
        
        const arrivedFloor = result.elevator.currentFloor;
        
        const alightingPassengers = elevator.passengers.filter(
          p => p.toFloor === arrivedFloor
        );
        
        if (alightingPassengers.length > 0) {
          const remainingPassengers = elevator.passengers.filter(
            p => p.toFloor !== arrivedFloor
          );
          
          for (const p of alightingPassengers) {
            p.state = 'completed';
            p.exitedAt = newSimTime;
            
            const passengerIdx = newPassengers.findIndex(pp => pp.id === p.id);
            if (passengerIdx !== -1) {
              newPassengers[passengerIdx] = { ...p };
            }
            
            const callIdx = newHallCalls.findIndex(c => c.passengerId === p.id && !c.resolved);
            if (callIdx !== -1) {
              newHallCalls[callIdx] = {
                ...newHallCalls[callIdx],
                resolved: true,
                resolvedTime: newSimTime,
              };
            }
          }
          
          const newLoad = remainingPassengers.reduce((sum, p) => sum + p.weight, 0);
          result.elevator.passengers = remainingPassengers;
          result.elevator.load = newLoad;
        }
        
        let elevatorDirection: 'up' | 'down' | 'idle';
        if (result.elevator.targetFloors.length > 0) {
          elevatorDirection = result.elevator.currentFloor < result.elevator.targetFloors[0] ? 'up' : 'down';
        } else {
          elevatorDirection = 'idle';
        }
        
        const manualCallsHere = newHallCalls.filter(
          c => c.fromFloor === arrivedFloor && 
               !c.pickedUp && 
               c.passengerId === null
        );
        for (const call of manualCallsHere) {
          const assignedToMe = call.assignedElevator === elevator.id;
          const directionMatch = 
            call.assignedElevator === null && 
            (elevatorDirection === 'idle' || elevatorDirection === call.direction);
          
          if (assignedToMe || directionMatch) {
            call.pickedUp = true;
            call.pickedUpTime = newSimTime;
            if (assignedToMe && call.assignedElevator) {
            }
          }
        }
        
        const waitingPassengersHere = newPassengers.filter(
          p => p.state === 'waiting' && 
               p.fromFloor === arrivedFloor
        );
        
        let currentLoad = result.elevator.load;
        const boardingPassengers: Passenger[] = [];
        
        for (const passenger of waitingPassengersHere) {
          if (currentLoad + passenger.weight <= result.elevator.capacity) {
            const passengerCall = newHallCalls.find(c => 
              c.passengerId === passenger.id && !c.pickedUp
            );
            
            const direction = passenger.toFloor > passenger.fromFloor ? 'up' : 'down';
            const directionConsistent = 
              elevatorDirection === 'idle' || elevatorDirection === direction;
            
            const canBoard = passengerCall && directionConsistent;
            
            if (canBoard) {
              currentLoad += passenger.weight;
              passenger.state = 'riding';
              passenger.elevatorId = elevator.id;
              passenger.boardedAt = newSimTime;
              boardingPassengers.push(passenger);
              
              if (passengerCall) {
                passengerCall.pickedUp = true;
                passengerCall.pickedUpTime = newSimTime;
                passengerCall.assignedElevator = elevator.id;
              }
            }
          }
        }
        
        if (boardingPassengers.length > 0) {
          for (const bp of boardingPassengers) {
            const pIdx = newPassengers.findIndex(pp => pp.id === bp.id);
            if (pIdx !== -1) {
              newPassengers[pIdx] = { ...bp };
            }
            result.elevator = addTargetFloor(result.elevator, bp.toFloor);
          }
          result.elevator.load = currentLoad;
          result.elevator.passengers = [...result.elevator.passengers, ...boardingPassengers];
        }
        
        const stillWaitingHere = newPassengers.filter(
          p => p.state === 'waiting' && p.fromFloor === arrivedFloor
        );
        
        if (stillWaitingHere.length > 0) {
          const otherElevators = [...newElevators];
          otherElevators[i] = result.elevator;
          
          const reassigned = reassignWaitingPassengers(
            newPassengers,
            newHallCalls,
            otherElevators,
            state.strategy,
            state.peakDirection,
            newSimTime,
            elevator.id
          );
          newPassengers = reassigned.passengers;
          newHallCalls = reassigned.hallCalls;
          for (let j = 0; j < newElevators.length; j++) {
            if (j !== i) {
              newElevators[j] = reassigned.elevators[j];
            }
          }
        }
      }
      
      if (result.doorEvent === 'closed') {
        delete newDoorOpenSimTimes[elevator.id];
      }
      
      newElevators[i] = result.elevator;
    }
    
    for (const elevatorId in newDoorOpenSimTimes) {
      const openDuration = newSimTime - newDoorOpenSimTimes[elevatorId];
      const requiredOpenTime = ELEVATOR_CONFIG.DOOR_OPEN_TIME;
      
      if (openDuration > requiredOpenTime) {
        const idx = newElevators.findIndex(e => e.id === elevatorId);
        if (idx !== -1 && newElevators[idx].state === 'open') {
          newElevators[idx] = startClosingDoor(newElevators[idx]);
        }
      }
    }
    
    const unassignedCalls = newHallCalls.filter(
      c => !c.assignedElevator && !c.pickedUp && !c.resolved
    );
    
    if (unassignedCalls.length > 0) {
      const scheduler = getScheduler(state.strategy);
      for (const call of unassignedCalls) {
        const assignedId = scheduler.selectElevator(
          call,
          newElevators,
          newHallCalls,
          state.peakDirection
        );
        
        if (assignedId) {
          call.assignedElevator = assignedId;
          const passenger = newPassengers.find(p => p.id === call.passengerId);
          if (passenger) {
            passenger.elevatorId = assignedId;
          }
          const idx = newElevators.findIndex(e => e.id === assignedId);
          if (idx !== -1) {
            newElevators[idx] = addTargetFloor(newElevators[idx], call.fromFloor);
          }
        }
      }
    }
    
    for (let pi = 0; pi < newPassengers.length; pi++) {
      const p = newPassengers[pi];
      const callForP = newHallCalls.find(c => c.passengerId === p.id);
      
      if (!callForP) continue;
      
      if (p.state === 'waiting' && callForP.pickedUp && !callForP.resolved) {
        p.state = 'riding';
        p.elevatorId = callForP.assignedElevator;
        if (!p.boardedAt) p.boardedAt = newSimTime;
      }
      
      if (p.state === 'riding' && callForP.resolved) {
        p.state = 'completed';
        if (!p.exitedAt) p.exitedAt = newSimTime;
      }
      
      if ((p.state === 'waiting' || p.state === 'riding') && callForP.resolved) {
        p.state = 'completed';
        if (!p.exitedAt) p.exitedAt = newSimTime;
      }
      
      newPassengers[pi] = { ...p };
    }
    
    newStatistics = updateStatistics(
      newStatistics,
      newHallCalls,
      newPassengers,
      simDeltaMs,
      1
    );
    
    set({
      simulationTimeMs: newSimTime,
      elevators: newElevators,
      hallCalls: newHallCalls,
      passengers: newPassengers,
      statistics: newStatistics,
      doorOpenSimTimes: newDoorOpenSimTimes,
      lastSpawnSimTime: newLastSpawnSimTime,
      lastFrameRealTime: currentRealTime,
    });
  },
}));
