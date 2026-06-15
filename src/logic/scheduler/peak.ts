import type { Elevator, HallCall } from '../../types';
import type { Scheduler } from './index';
import { calculateDistance, isSuitableDirection } from './index';

const MID_FLOOR = 2;

function getElevatorZone(elevatorId: string, peakDirection: 'up' | 'down'): 'low' | 'high' {
  if (peakDirection === 'up') {
    return elevatorId === 'A' ? 'low' : 'high';
  } else {
    return elevatorId === 'A' ? 'high' : 'low';
  }
}

function getFloorZone(floor: number): 'low' | 'high' {
  return floor <= MID_FLOOR ? 'low' : 'high';
}

export const peakScheduler: Scheduler = {
  name: 'peak',
  selectElevator: (
    hallCall: HallCall,
    elevators: Elevator[],
    allCalls: HallCall[],
    peakDirection: 'up' | 'down' = 'up'
  ) => {
    const availableElevators = elevators.filter(e => {
      if (e.load >= e.capacity * 0.95) return false;
      return true;
    });

    if (availableElevators.length === 0) return null;

    const isPeakDirection = hallCall.direction === peakDirection;
    const callZone = getFloorZone(hallCall.fromFloor);

    const primaryElevators = availableElevators.filter(e => 
      getElevatorZone(e.id, peakDirection) === callZone
    );

    let candidatePool: Elevator[] = primaryElevators.length > 0 
      ? primaryElevators 
      : availableElevators;

    let bestElevator: Elevator | null = null;
    let bestScore = Infinity;

    for (const elevator of candidatePool) {
      const elevatorZone = getElevatorZone(elevator.id, peakDirection);
      const zoneMatch = elevatorZone === callZone;
      
      const distance = calculateDistance(elevator, hallCall.fromFloor);
      const suitable = isSuitableDirection(elevator, hallCall.fromFloor, hallCall.direction);
      const loadRatio = elevator.load / elevator.capacity;
      const pendingCalls = allCalls.filter(
        c => c.assignedElevator === elevator.id && !c.pickedUp
      ).length;
      
      const inOwnZone = getFloorZone(elevator.currentFloor) === elevatorZone;
      
      const hasReverseTargets = elevator.targetFloors.some(f => {
        if (peakDirection === 'up') {
          return f < elevator.currentFloor;
        } else {
          return f > elevator.currentFloor;
        }
      });

      let score = 0;
      
      score += distance * 1.0;
      
      if (isPeakDirection) {
        score += suitable ? 0 : 20;
        score += loadRatio * 12;
        score += pendingCalls * 3;
        score += zoneMatch ? 0 : 30;
        score += inOwnZone ? 0 : 10;
        score += hasReverseTargets ? 15 : 0;
      } else {
        score += suitable ? 0 : 10;
        score += loadRatio * 6;
        score += pendingCalls * 1.5;
        score += zoneMatch ? 0 : 15;
        score += inOwnZone ? 0 : 5;
      }
      
      if (score < bestScore) {
        bestScore = score;
        bestElevator = elevator;
      }
    }

    return bestElevator ? bestElevator.id : null;
  },
};
