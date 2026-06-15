import type { Statistics, HallCall, Passenger } from '../types';

export function createInitialStatistics(): Statistics {
  return {
    averageWaitTime: 0,
    maxWaitTime: 0,
    totalRides: 0,
    startStopCount: { A: 0, B: 0 },
    simulationTime: 0,
    totalRequests: 0,
    completedRequests: 0,
    waitTimes: [],
    rideTimes: [],
  };
}

export function updateStatistics(
  stats: Statistics,
  hallCalls: HallCall[],
  passengers: Passenger[],
  deltaTime: number,
  simulationSpeed: number
): Statistics {
  const newStats = { ...stats };
  
  newStats.simulationTime += deltaTime * simulationSpeed / 1000;
  
  const pickedUpCalls = hallCalls.filter(c => c.pickedUp && c.pickedUpTime);
  const waitTimes = pickedUpCalls.map(c => {
    if (c.pickedUpTime) {
      return (c.pickedUpTime - c.timestamp) / 1000;
    }
    return 0;
  }).filter(t => t > 0);
  
  if (waitTimes.length > 0) {
    newStats.waitTimes = waitTimes;
    newStats.averageWaitTime = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
    newStats.maxWaitTime = Math.max(...waitTimes);
  }
  
  const completedPassengers = passengers.filter(p => p.state === 'completed');
  newStats.totalRides = completedPassengers.length;
  
  const completedCalls = hallCalls.filter(c => c.resolved && c.resolvedTime);
  newStats.completedRequests = completedCalls.length;
  newStats.totalRequests = hallCalls.length;
  
  const rideTimes = completedPassengers
    .filter(p => p.boardedAt && p.exitedAt)
    .map(p => ((p.exitedAt! - p.boardedAt!) / 1000));
  newStats.rideTimes = rideTimes;
  
  return newStats;
}

export function incrementStartStop(stats: Statistics, elevatorId: string): Statistics {
  return {
    ...stats,
    startStopCount: {
      ...stats.startStopCount,
      [elevatorId]: (stats.startStopCount[elevatorId] || 0) + 1,
    },
  };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatNumber(num: number, decimals: number = 1): string {
  return num.toFixed(decimals);
}
