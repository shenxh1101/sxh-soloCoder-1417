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
    const midFloor = Math.ceil(elevators[0].targetFloors.length / 2);

    let bestElevator: Elevator | null = null;
    let bestScore = Infinity;

    for (const elevator of availableElevators) {
      const distance = calculateDistance(elevator, hallCall.fromFloor);
      const suitable = isSuitableDirection(elevator, hallCall.fromFloor, hallCall.direction);
      const loadRatio = elevator.load / elevator.capacity;
      const assignedCalls = allCalls.filter(
        c => c.assignedElevator === elevator.id && !c.resolved
      ).length;
      
      const elevatorZone = elevator.currentFloor <= midFloor ? 'low' : 'high';
      const callZone = hallCall.fromFloor <= midFloor ? 'low' : 'high';
      const zoneMatch = elevatorZone === callZone;

      let score = 0;
      
      if (isPeakDirection) {
        score += distance * 1.5;
        score += suitable ? 0 : 12;
        score += loadRatio * 8;
        score += assignedCalls * 2;
        score += zoneMatch ? 0 : 5;
      } else {
        score += distance * 3;
        score += suitable ? 0 : 6;
        score += loadRatio * 3;
        score += assignedCalls * 1;
        score += zoneMatch ? 0 : 3;
      }
      
      if (score < bestScore) {
        bestScore = score;
        bestElevator = elevator;
      }
    }

    return bestElevator ? bestElevator.id : null;
  },
};
