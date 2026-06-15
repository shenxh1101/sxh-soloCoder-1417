import type { Passenger, PassengerIntensity, HallCall } from '../types';
import { PASSENGER_CONFIG, BUILDING_CONFIG } from '../config/constants';

let passengerIdCounter = 0;
let hallCallIdCounter = 0;

export function generatePassenger(): { passenger: Passenger; hallCall: HallCall } {
  const fromFloor = Math.floor(Math.random() * BUILDING_CONFIG.NUM_FLOORS);
  let toFloor = Math.floor(Math.random() * BUILDING_CONFIG.NUM_FLOORS);
  
  while (toFloor === fromFloor) {
    toFloor = Math.floor(Math.random() * BUILDING_CONFIG.NUM_FLOORS);
  }
  
  const weight = PASSENGER_CONFIG.MIN_WEIGHT + 
    Math.random() * (PASSENGER_CONFIG.MAX_WEIGHT - PASSENGER_CONFIG.MIN_WEIGHT);
  
  const direction = toFloor > fromFloor ? 'up' : 'down';
  const now = Date.now();
  
  const passenger: Passenger = {
    id: passengerIdCounter++,
    fromFloor,
    toFloor,
    weight: Math.round(weight),
    elevatorId: null,
    state: 'waiting',
    createdAt: now,
    boardedAt: null,
    exitedAt: null,
  };
  
  const hallCall: HallCall = {
    id: hallCallIdCounter++,
    fromFloor,
    direction,
    timestamp: now,
    assignedElevator: null,
    resolved: false,
    resolvedTime: null,
    passengerId: passenger.id,
  };
  
  return { passenger, hallCall };
}

export function getSpawnInterval(intensity: PassengerIntensity): number {
  const [min, max] = {
    low: PASSENGER_CONFIG.LOW_INTENSITY_INTERVAL,
    medium: PASSENGER_CONFIG.MEDIUM_INTENSITY_INTERVAL,
    high: PASSENGER_CONFIG.HIGH_INTENSITY_INTERVAL,
  }[intensity];
  
  return min + Math.random() * (max - min);
}

export function resetCounters(): void {
  passengerIdCounter = 0;
  hallCallIdCounter = 0;
}

export function createManualHallCall(
  fromFloor: number,
  direction: 'up' | 'down'
): HallCall {
  const now = Date.now();
  return {
    id: hallCallIdCounter++,
    fromFloor,
    direction,
    timestamp: now,
    assignedElevator: null,
    resolved: false,
    resolvedTime: null,
    passengerId: null,
  };
}

export function createManualCarCall(
  elevatorId: string,
  floor: number,
  passenger: Passenger
): { passenger: Passenger; hallCall: HallCall } {
  const now = Date.now();
  
  const direction = floor > passenger.fromFloor ? 'up' : 'down';
  
  const hallCall: HallCall = {
    id: hallCallIdCounter++,
    fromFloor: floor,
    direction,
    timestamp: now,
    assignedElevator: elevatorId,
    resolved: false,
    resolvedTime: null,
    passengerId: passenger.id,
  };
  
  return { passenger, hallCall };
}
