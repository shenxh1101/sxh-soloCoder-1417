import { Play, Pause, RotateCcw, Settings, Users, Gauge } from 'lucide-react';
import { useElevatorStore } from '../../store/useElevatorStore';
import type { SchedulingStrategy, PassengerIntensity } from '../../types';
import { STRATEGY_LABELS, INTENSITY_LABELS } from '../../config/constants';

export function ControlPanel() {
  const isRunning = useElevatorStore(state => state.isRunning);
  const isPaused = useElevatorStore(state => state.isPaused);
  const strategy = useElevatorStore(state => state.strategy);
  const intensity = useElevatorStore(state => state.intensity);
  const simulationSpeed = useElevatorStore(state => state.simulationSpeed);
  const peakDirection = useElevatorStore(state => state.peakDirection);
  
  const startSimulation = useElevatorStore(state => state.startSimulation);
  const pauseSimulation = useElevatorStore(state => state.pauseSimulation);
  const resumeSimulation = useElevatorStore(state => state.resumeSimulation);
  const reset = useElevatorStore(state => state.reset);
  const setStrategy = useElevatorStore(state => state.setStrategy);
  const setIntensity = useElevatorStore(state => state.setIntensity);
  const setSimulationSpeed = useElevatorStore(state => state.setSimulationSpeed);
  const setPeakDirection = useElevatorStore(state => state.setPeakDirection);

  const handleStartPause = () => {
    if (!isRunning) {
      startSimulation();
    } else if (isPaused) {
      resumeSimulation();
    } else {
      pauseSimulation();
    }
  };

  return (
    <div className="w-72 bg-slate-900/90 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 border-b border-cyan-500/30 pb-3">
        <Settings className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-bold text-cyan-400">控制面板</h2>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={handleStartPause}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all duration-200 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 hover:border-cyan-400"
        >
          {!isRunning || isPaused ? (
            <><Play className="w-4 h-4" /> 开始</>
          ) : (
            <><Pause className="w-4 h-4" /> 暂停</>
          )}
        </button>
        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all duration-200 bg-orange-500/20 border border-orange-500/50 text-orange-400 hover:bg-orange-500/30 hover:border-orange-400"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-slate-300 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          调度策略
        </label>
        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value as SchedulingStrategy)}
          className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-400 transition-colors"
        >
          {Object.entries(STRATEGY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {strategy === 'peak' && (
        <div className="space-y-2">
          <label className="text-sm text-slate-300">高峰期方向</label>
          <div className="flex gap-2">
            <button
              onClick={() => setPeakDirection('up')}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
                peakDirection === 'up'
                  ? 'bg-green-500/30 border border-green-500 text-green-400'
                  : 'bg-slate-800 border border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
            >
              上行
            </button>
            <button
              onClick={() => setPeakDirection('down')}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
                peakDirection === 'down'
                  ? 'bg-orange-500/30 border border-orange-500 text-orange-400'
                  : 'bg-slate-800 border border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
            >
              下行
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm text-slate-300 flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          客流强度
        </label>
        <div className="flex gap-2">
          {Object.entries(INTENSITY_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setIntensity(value as PassengerIntensity)}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                intensity === value
                  ? 'bg-cyan-500/30 border border-cyan-500 text-cyan-400'
                  : 'bg-slate-800 border border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-slate-300">
          模拟速度: {simulationSpeed.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="5"
          step="0.5"
          value={simulationSpeed}
          onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>0.5x</span>
          <span>2.5x</span>
          <span>5x</span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
        <h3 className="text-sm font-medium text-cyan-400 mb-2">操作说明</h3>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• 点击楼层旁的 ↑/↓ 按钮呼叫电梯</li>
          <li>• 鼠标拖拽旋转3D场景视角</li>
          <li>• 滚轮缩放场景</li>
          <li>• 切换调度策略观察效率变化</li>
        </ul>
      </div>
    </div>
  );
}
