import { Clock, Timer, Activity, TrendingUp, BarChart3, Users, Layers } from 'lucide-react';
import { useElevatorStore } from '../../store/useElevatorStore';
import { formatTime, formatNumber } from '../../logic/statistics';
import { STRATEGY_LABELS, INTENSITY_LABELS } from '../../config/constants';

export function StatsPanel() {
  const statistics = useElevatorStore(state => state.statistics);
  const strategy = useElevatorStore(state => state.strategy);
  const intensity = useElevatorStore(state => state.intensity);
  const peakDirection = useElevatorStore(state => state.peakDirection);
  const passengers = useElevatorStore(state => state.passengers);
  const hallCalls = useElevatorStore(state => state.hallCalls);
  const elevators = useElevatorStore(state => state.elevators);
  
  const totalStartStops = Object.values(statistics.startStopCount).reduce((a, b) => a + b, 0);
  
  const averageRideTime = statistics.rideTimes.length > 0
    ? statistics.rideTimes.reduce((a, b) => a + b, 0) / statistics.rideTimes.length
    : 0;
  
  const pickedUpCount = hallCalls.filter(c => c.pickedUp).length;
  const waitingForPickup = hallCalls.filter(c => !c.pickedUp && c.assignedElevator).length;
  
  const elevatorARequests = hallCalls.filter(c => c.assignedElevator === 'A').length;
  const elevatorBRequests = hallCalls.filter(c => c.assignedElevator === 'B').length;
  
  const getStrategyDescription = () => {
    switch (strategy) {
      case 'nearest':
        return '选择距离最近且同向的电梯响应请求';
      case 'balanced':
        return '综合考虑距离、负载和待处理请求数均衡分配';
      case 'peak':
        return peakDirection === 'up' 
          ? 'A梯负责低楼层(0-2)，B梯负责高楼层(3-5)，优先响应上行请求'
          : 'A梯负责高楼层(3-5)，B梯负责低楼层(0-2)，优先响应下行请求';
      default:
        return '';
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4">
      <div className="flex items-center gap-2 border-b border-cyan-500/30 pb-3 mb-4">
        <BarChart3 className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-bold text-cyan-400">统计数据</h2>
        <div className="ml-auto flex gap-2">
          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">
            调度: {STRATEGY_LABELS[strategy]}
          </span>
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
            客流: {INTENSITY_LABELS[intensity]}
          </span>
          {strategy === 'peak' && (
            <span className={`px-2 py-0.5 text-xs rounded ${
              peakDirection === 'up' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-orange-500/20 text-orange-400'
            }`}>
              高峰: {peakDirection === 'up' ? '上行' : '下行'}
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-8 gap-3">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-cyan-500/20">
          <div className="flex items-center gap-2 text-cyan-400 text-sm mb-1">
            <Timer className="w-4 h-4" />
            <span>运行时间</span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {formatTime(statistics.simulationTime)}
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3 border border-green-500/20">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
            <Clock className="w-4 h-4" />
            <span>平均候梯</span>
          </div>
          <div className="text-2xl font-bold font-mono text-green-400">
            {formatNumber(statistics.averageWaitTime)}s
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3 border border-orange-500/20">
          <div className="flex items-center gap-2 text-orange-400 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>最长候梯</span>
          </div>
          <div className="text-2xl font-bold font-mono text-orange-400">
            {formatNumber(statistics.maxWaitTime)}s
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3 border border-teal-500/20">
          <div className="flex items-center gap-2 text-teal-400 text-sm mb-1">
            <Clock className="w-4 h-4" />
            <span>平均乘梯</span>
          </div>
          <div className="text-2xl font-bold font-mono text-teal-400">
            {formatNumber(averageRideTime)}s
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3 border border-yellow-500/20">
          <div className="flex items-center gap-2 text-yellow-400 text-sm mb-1">
            <Activity className="w-4 h-4" />
            <span>启停次数</span>
          </div>
          <div className="text-2xl font-bold font-mono text-yellow-400">
            {totalStartStops}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            A: {statistics.startStopCount['A'] || 0} / B: {statistics.startStopCount['B'] || 0}
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3 border border-blue-500/20">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
            <Users className="w-4 h-4" />
            <span>已接/待接</span>
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">
            {pickedUpCount} / {waitingForPickup}
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3 border border-purple-500/20">
          <div className="flex items-center gap-2 text-purple-400 text-sm mb-1">
            <Activity className="w-4 h-4" />
            <span>总请求</span>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">
            {statistics.totalRequests}
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3 border border-pink-500/20">
          <div className="flex items-center gap-2 text-pink-400 text-sm mb-1">
            <Activity className="w-4 h-4" />
            <span>已完成</span>
          </div>
          <div className="text-2xl font-bold font-mono text-pink-400">
            {statistics.completedRequests}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {statistics.totalRequests > 0 
              ? `${Math.round((statistics.completedRequests / statistics.totalRequests) * 100)}%`
              : '0%'}
          </div>
        </div>
      </div>
      
      {strategy === 'peak' && (
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-cyan-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">高峰期分区调度</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
              <span className="text-sm text-slate-300">
                A梯: {peakDirection === 'up' ? '低楼层(0-2)' : '高楼层(3-5)'}
                <span className="text-xs text-slate-500 ml-2">
                  (已分配 {elevatorARequests} 个请求)
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm text-slate-300">
                B梯: {peakDirection === 'up' ? '高楼层(3-5)' : '低楼层(0-2)'}
                <span className="text-xs text-slate-500 ml-2">
                  (已分配 {elevatorBRequests} 个请求)
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
        <div className="text-xs text-slate-400">
          <span className="text-cyan-400 font-medium">策略说明：</span>
          {getStrategyDescription()}
        </div>
      </div>
      
      {statistics.waitTimes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="text-sm text-slate-400 mb-2">候梯时间分布</div>
          <div className="h-16 bg-slate-800/50 rounded-lg p-2 flex items-end gap-1">
            {statistics.waitTimes.slice(-30).map((time, idx) => {
              const maxTime = Math.max(...statistics.waitTimes, 1);
              const height = (time / maxTime) * 100;
              const color = time > 15 ? '#ff3366' : time > 8 ? '#ff6b35' : '#00ff88';
              return (
                <div 
                  key={idx}
                  className="flex-1 rounded-t transition-all duration-300"
                  style={{ 
                    height: `${Math.max(height, 5)}%`,
                    backgroundColor: color,
                    opacity: 0.8,
                  }}
                  title={`${time.toFixed(1)}s`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>最近30次候梯时间</span>
            <span>最高: {formatNumber(Math.max(...statistics.waitTimes, 0))}s</span>
          </div>
        </div>
      )}
    </div>
  );
}
