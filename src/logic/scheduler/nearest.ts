import type { Elevator, HallCall } from '../../types';
import type { Scheduler } from './index';
import { calculateDistance, isSuitableDirection } from './index';

export const nearestScheduler: Scheduler = {
  name: 'nearest',
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
      const pendingCalls = allCalls.filter(
        c => c.assignedElevator === elevator.id && !c.pickedUp
      ).length;
      
      const score = suitable ? distance + pendingCalls * 0.5 : distance + 10 + pendingCalls * 0.5;
      
      if (score < bestScore) {
        bestScore = score;
        bestElevator = elevator;
      }
    }

    return bestElevator ? bestElevator.id : null;
  },
};
