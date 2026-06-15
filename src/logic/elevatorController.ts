import type { Elevator, HallCall, Passenger } from '../types';
import { BUILDING_CONFIG, ELEVATOR_CONFIG } from '../config/constants';

export function floorToY(floor: number): number {
  return floor * BUILDING_CONFIG.FLOOR_HEIGHT;
}

export function yToFloor(y: number): number {
  return Math.round(y / BUILDING_CONFIG.FLOOR_HEIGHT);
}

export function createElevator(id: string, name: string): Elevator {
  return {
    id,
    name,
    currentFloor: 0,
    targetY: 0,
    direction: 'idle',
    state: 'idle',
    load: 0,
    capacity: ELEVATOR_CONFIG.MAX_CAPACITY,
    targetFloors: [],
    doorOpen: false,
    doorProgress: 0,
    passengers: [],
    currentY: 0,
  };
}

export function addTargetFloor(elevator: Elevator, floor: number): Elevator {
  if (!elevator.targetFloors.includes(floor)) {
    const newTargets = [...elevator.targetFloors, floor];
    if (elevator.direction === 'up') {
      newTargets.sort((a, b) => a - b);
    } else if (elevator.direction === 'down') {
      newTargets.sort((a, b) => b - a);
    } else {
      if (floor > elevator.currentFloor) {
        newTargets.sort((a, b) => a - b);
      } else {
        newTargets.sort((a, b) => b - a);
      }
    }
    return { ...elevator, targetFloors: newTargets };
  }
  return elevator;
}

export function getNextTarget(elevator: Elevator): number | null {
  if (elevator.targetFloors.length === 0) return null;
  return elevator.targetFloors[0];
}

export function updateElevator(
  elevator: Elevator,
  deltaTime: number,
  simulationSpeed: number
): { elevator: Elevator; arrived: boolean; doorEvent: 'opened' | 'closed' | null } {
  let newElevator = { ...elevator };
  let arrived = false;
  let doorEvent: 'opened' | 'closed' | null = null;

  const dt = (deltaTime * simulationSpeed) / 1000;

  switch (elevator.state) {
    case 'idle': {
      const nextTarget = getNextTarget(elevator);
      if (nextTarget !== null) {
        newElevator.targetY = floorToY(nextTarget);
        newElevator.direction = nextTarget > elevator.currentFloor ? 'up' : 'down';
        newElevator.state = 'moving';
      }
      break;
    }

    case 'moving': {
      const targetY = elevator.targetY;
      const moveDistance = ELEVATOR_CONFIG.SPEED * dt;
      let newY = elevator.currentY;
      
      if (elevator.direction === 'up') {
        newY = Math.min(elevator.currentY + moveDistance, targetY);
      } else if (elevator.direction === 'down') {
        newY = Math.max(elevator.currentY - moveDistance, targetY);
      }
      
      newElevator.currentY = newY;
      newElevator.currentFloor = yToFloor(newY);
      
      if (Math.abs(newY - targetY) < 0.01) {
        newElevator.currentY = targetY;
        newElevator.currentFloor = yToFloor(targetY);
        newElevator.state = 'opening';
        newElevator.doorOpen = false;
        arrived = true;
      }
      break;
    }

    case 'opening': {
      let newProgress = elevator.doorProgress + ELEVATOR_CONFIG.DOOR_SPEED * dt;
      if (newProgress >= 1) {
        newProgress = 1;
        newElevator.state = 'open';
        newElevator.doorOpen = true;
        doorEvent = 'opened';
      }
      newElevator.doorProgress = newProgress;
      break;
    }

    case 'open': {
      break;
    }

    case 'closing': {
      let newProgress = elevator.doorProgress - ELEVATOR_CONFIG.DOOR_SPEED * dt;
      if (newProgress <= 0) {
        newProgress = 0;
        newElevator.state = 'idle';
        newElevator.doorOpen = false;
        doorEvent = 'closed';
        
        newElevator.targetFloors = newElevator.targetFloors.filter(
          f => f !== newElevator.currentFloor
        );
        
        if (newElevator.targetFloors.length > 0) {
          const nextTarget = getNextTarget(newElevator);
          if (nextTarget !== null) {
            newElevator.targetY = floorToY(nextTarget);
            newElevator.direction = nextTarget > newElevator.currentFloor ? 'up' : 'down';
            newElevator.state = 'moving';
          }
        } else {
          newElevator.direction = 'idle';
        }
      }
      newElevator.doorProgress = newProgress;
      break;
    }
  }

  return { elevator: newElevator, arrived, doorEvent };
}

export function startClosingDoor(elevator: Elevator): Elevator {
  if (elevator.state === 'open') {
    return { ...elevator, state: 'closing' };
  }
  return elevator;
}

export function shouldStopAtFloor(elevator: Elevator, floor: number): boolean {
  return elevator.targetFloors.includes(floor);
}

export function updateElevatorLoad(elevator: Elevator, passengers: Passenger[]): Elevator {
  const load = passengers.reduce((sum, p) => sum + p.weight, 0);
  return { ...elevator, load, passengers };
}
