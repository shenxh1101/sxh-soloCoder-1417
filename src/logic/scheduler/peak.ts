import type { Elevator, HallCall } from '../../types';
import type { Scheduler } from './index';
import { calculateDistance, isSuitableDirection } from './index';

export const peakScheduler: Scheduler = {
  name: 'peak',
  selectElevator: (
    hallCall: HallCall,
    elevators: Elevator[],
    allCalls: HallCall[],
    peakDirection: 'up' | 'down' = 'up'
  ) => {
    const availableElevators = elevators.filter(e => {
      if (e.load >= e.capacity) return false;
      return true;
    });

    if (availableElevators.length === 0) return null;

    const isPeakDirection = hallCall.direction === peakDirection;
    const numFloors = 6;
    const midFloor = Math.floor(numFloors / 2);
    
    let elevatorAZone: 'low' | 'high';
    let elevatorBZone: 'low' | 'high';
    
    if (peakDirection === 'up') {
      elevatorAZone = 'low';
      elevatorBZone = 'high';
    } else {
      elevatorAZone = 'high';
      elevatorBZone = 'low';
    }
    
    const callZone = hallCall.fromFloor <= midFloor ? 'low' : 'high';

    let bestElevator: Elevator | null = null;
    let bestScore = Infinity;

    for (const elevator of availableElevators) {
      const elevatorZone = elevator.id === 'A' ? elevatorAZone : elevatorBZone;
      const zoneMatch = elevatorZone === callZone;
      
      const distance = calculateDistance(elevator, hallCall.fromFloor);
      const suitable = isSuitableDirection(elevator, hallCall.fromFloor, hallCall.direction);
      const loadRatio = elevator.load / elevator.capacity;
      const assignedCalls = allCalls.filter(
        c => c.assignedElevator === elevator.id && !c.pickedUp
      ).length;
      
      const elevatorCurrentZone = elevator.currentFloor <= midFloor ? 'low' : 'high';
      const inOwnZone = elevatorCurrentZone === elevatorZone;
      
      const hasOppositeDirectionTargets = elevator.targetFloors.some(f => {
        if (peakDirection === 'up') {
          return f < elevator.currentFloor;
        } else {
          return f > elevator.currentFloor;
        }
      });

      let score = 0;
      
      if (isPeakDirection) {
        score += distance * 1.0;
        score += suitable ? 0 : 15;
        score += loadRatio * 10;
        score += assignedCalls * 3;
        score += zoneMatch ? 0 : 20;
        score += inOwnZone ? 0 : 8;
        score += hasOppositeDirectionTargets ? 10 : 0;
      } else {
        score += distance * 2.5;
        score += suitable ? 0 : 8;
        score += loadRatio * 4;
        score += assignedCalls * 1.5;
        score += zoneMatch ? 0 : 10;
        score += inOwnZone ? 0 : 4;
      }
      
      if (score < bestScore) {
        bestScore = score;
        bestElevator = elevator;
      }
    }

    return bestElevator ? bestElevator.id : null;
  },
};
