import type { Elevator, HallCall } from '../../types';
import type { Scheduler } from './index';
import { calculateDistance, isSuitableDirection } from './index';

export const nearestScheduler: Scheduler = {
  name: 'nearest',
  selectElevator: (hallCall: HallCall, elevators: Elevator[]) => {
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
      
      const score = suitable ? distance : distance + 10;
      
      if (score < bestScore) {
        bestScore = score;
        bestElevator = elevator;
      }
    }

    return bestElevator ? bestElevator.id : null;
  },
};
