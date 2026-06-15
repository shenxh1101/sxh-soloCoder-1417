export type ElevatorDirection = 'up' | 'down' | 'idle';
export type ElevatorState = 'idle' | 'moving' | 'opening' | 'open' | 'closing';
export type PassengerState = 'waiting' | 'entering' | 'riding' | 'exiting' | 'completed';
export type SchedulingStrategy = 'nearest' | 'balanced' | 'peak';
export type PassengerIntensity = 'low' | 'medium' | 'high';

export interface Passenger {
  id: number;
  fromFloor: number;
  toFloor: number;
  weight: number;
  elevatorId: string | null;
  state: PassengerState;
  createdAt: number;
  boardedAt: number | null;
  exitedAt: number | null;
}

export interface Elevator {
  id: string;
  name: string;
  currentFloor: number;
  targetY: number;
  direction: ElevatorDirection;
  state: ElevatorState;
  load: number;
  capacity: number;
  targetFloors: number[];
  doorOpen: boolean;
  doorProgress: number;
  passengers: Passenger[];
  currentY: number;
}

export interface HallCall {
  id: number;
  fromFloor: number;
  direction: 'up' | 'down';
  timestamp: number;
  assignedElevator: string | null;
  resolved: boolean;
  resolvedTime: number | null;
  passengerId: number | null;
}

export interface Statistics {
  averageWaitTime: number;
  maxWaitTime: number;
  totalRides: number;
  startStopCount: Record<string, number>;
  simulationTime: number;
  totalRequests: number;
  completedRequests: number;
  waitTimes: number[];
  rideTimes: number[];
}

export interface AppState {
  elevators: Elevator[];
  hallCalls: HallCall[];
  passengers: Passenger[];
  statistics: Statistics;
  strategy: SchedulingStrategy;
  intensity: PassengerIntensity;
  isRunning: boolean;
  isPaused: boolean;
  simulationSpeed: number;
  peakDirection: 'up' | 'down';
}

export interface FloorCall {
  floor: number;
  direction: 'up' | 'down';
}

export interface CarCall {
  elevatorId: string;
  floor: number;
}
