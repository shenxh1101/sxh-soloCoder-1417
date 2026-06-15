import type { Elevator, HallCall } from '../../types';
import type { Scheduler } from './index';
import { calculateDistance, isSuitableDirection, estimateArrivalTime } from './index';

export const balancedScheduler: Scheduler = {
  name: 'balanced',
  selectElevator: (hallCall: HallCall, elevators: Elevator[], allCalls: HallCall[]) => {
    const availableElevators = elevators.filter(e => {
      if (e.load >= e.capacity) return false;
      return true;
    });

    if (availableElevators.length === 0) return null;

    let bestElevator: Elevator | null = null;
    let bestScore = Infinity;

    for (const elevator of availableElevators) {
      const distance = calculateDistance(elevator, hallCall.fromFloor);
      const suitable = isSuitableDirection(elevator, hallCall.fromFloor, hallCall.direction);
      const loadRatio = elevator.load / elevator.capacity;
      const assignedCalls = allCalls.filter(
        c => c.assignedElevator === elevator.id && !c.pickedUp
      ).length;
      const estimatedTime = estimateArrivalTime(elevator, hallCall.fromFloor, allCalls);
      
      let score = 0;
      score += distance * 2;
      score += suitable ? 0 : 8;
      score += loadRatio * 5;
      score += assignedCalls * 1.5;
      score += estimatedTime * 0.5;
      
      if (score < bestScore) {
        bestScore = score;
        bestElevator = elevator;
      }
    }

    return bestElevator ? bestElevator.id : null;
  },
};
