import type { Elevator, HallCall, SchedulingStrategy } from '../../types';
import { nearestScheduler } from './nearest';
import { balancedScheduler } from './balanced';
import { peakScheduler } from './peak';

export interface Scheduler {
  name: string;
  selectElevator: (
    hallCall: HallCall,
    elevators: Elevator[],
    allCalls: HallCall[],
    peakDirection?: 'up' | 'down'
  ) => string | null;
}

const schedulers: Record<SchedulingStrategy, Scheduler> = {
  nearest: nearestScheduler,
  balanced: balancedScheduler,
  peak: peakScheduler,
};

export function getScheduler(strategy: SchedulingStrategy): Scheduler {
  return schedulers[strategy];
}

export function calculateDistance(elevator: Elevator, targetFloor: number): number {
  return Math.abs(elevator.currentFloor - targetFloor);
}

export function isSuitableDirection(
  elevator: Elevator,
  callFloor: number,
  callDirection: 'up' | 'down'
): boolean {
  if (elevator.direction === 'idle' || elevator.state === 'idle') return true;
  
  if (elevator.direction === 'up' && callDirection === 'up') {
    return elevator.currentFloor <= callFloor;
  }
  
  if (elevator.direction === 'down' && callDirection === 'down') {
    return elevator.currentFloor >= callFloor;
  }
  
  return false;
}

export function estimateArrivalTime(
  elevator: Elevator,
  targetFloor: number,
  allCalls: HallCall[]
): number {
  const distance = Math.abs(elevator.currentFloor - targetFloor);
  const stopsOnWay = elevator.targetFloors.filter(f => {
    if (elevator.direction === 'up') {
      return f > elevator.currentFloor && f <= targetFloor;
    } else if (elevator.direction === 'down') {
      return f < elevator.currentFloor && f >= targetFloor;
    }
    return true;
  }).length;
  
  const assignedCalls = allCalls.filter(
    c => c.assignedElevator === elevator.id && !c.resolved
  ).length;
  
  return distance * 2 + stopsOnWay * 3 + assignedCalls * 2;
}
