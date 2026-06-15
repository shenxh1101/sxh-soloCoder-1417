import { ArrowUp, ArrowDown } from 'lucide-react';
import { useElevatorStore } from '../../store/useElevatorStore';
import { BUILDING_CONFIG } from '../../config/constants';

export function HallCallButtons() {
  const hallCalls = useElevatorStore(state => state.hallCalls);
  const addHallCall = useElevatorStore(state => state.addHallCall);
  
  const floors = Array.from({ length: BUILDING_CONFIG.NUM_FLOORS }, (_, i) => i);
  
  const hasActiveCall = (floor: number, direction: 'up' | 'down') => {
    return hallCalls.some(
      c => c.fromFloor === floor && c.direction === direction && !c.resolved
    );
  };
  
  const handleCall = (floor: number, direction: 'up' | 'down') => {
    addHallCall(floor, direction);
  };

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-3 space-y-2 z-10">
      <div className="text-xs text-cyan-400 font-medium text-center mb-2 border-b border-cyan-500/30 pb-2">
        呼梯按钮
      </div>
      
      {[...floors].reverse().map((floor) => (
        <div key={floor} className="flex items-center gap-2">
          <span className="w-6 text-center text-slate-300 font-mono text-sm font-bold">
            {floor}
          </span>
          
          {floor < BUILDING_CONFIG.NUM_FLOORS - 1 && (
            <button
              onClick={() => handleCall(floor, 'up')}
              className={`p-1.5 rounded transition-all duration-200 ${
                hasActiveCall(floor, 'up')
                  ? 'bg-green-500/30 border border-green-500 text-green-400 shadow-lg shadow-green-500/20'
                  : 'bg-slate-800 border border-slate-600 text-slate-400 hover:border-green-500 hover:text-green-400'
              }`}
              title={`${floor}层 上行`}
            >
              <ArrowUp className="w-3 h-3" />
            </button>
          )}
          
          {floor > 0 && (
            <button
              onClick={() => handleCall(floor, 'down')}
              className={`p-1.5 rounded transition-all duration-200 ${
                hasActiveCall(floor, 'down')
                  ? 'bg-orange-500/30 border border-orange-500 text-orange-400 shadow-lg shadow-orange-500/20'
                  : 'bg-slate-800 border border-slate-600 text-slate-400 hover:border-orange-500 hover:text-orange-400'
              }`}
              title={`${floor}层 下行`}
            >
              <ArrowDown className="w-3 h-3" />
            </button>
          )}
          
          {floor === BUILDING_CONFIG.NUM_FLOORS - 1 && (
            <div className="w-6" />
          )}
          
          {floor === 0 && (
            <div className="w-6" />
          )}
        </div>
      ))}
      
      <div className="text-xs text-slate-500 text-center mt-2 pt-2 border-t border-slate-700">
        点击按钮呼叫电梯
      </div>
    </div>
  );
}
