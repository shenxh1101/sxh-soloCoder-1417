import { Activity, ArrowUp, ArrowDown, Weight, Users, Clock } from 'lucide-react';
import { useElevatorStore } from '../../store/useElevatorStore';
import { ELEVATOR_STATE_LABELS, ELEVATOR_DIRECTION_LABELS, COLORS } from '../../config/constants';

function ElevatorCard({ elevatorId }: { elevatorId: string }) {
  const elevator = useElevatorStore(state => 
    state.elevators.find(e => e.id === elevatorId)
  );
  const addCarCall = useElevatorStore(state => state.addCarCall);
  
  if (!elevator) return null;
  
  const loadPercent = (elevator.load / elevator.capacity) * 100;
  const isOverloaded = loadPercent >= 90;
  const carColor = elevatorId === 'A' ? COLORS.ELEVATOR_A : COLORS.ELEVATOR_B;
  
  const getStateColor = (state: string) => {
    switch (state) {
      case 'moving': return 'text-green-400';
      case 'opening':
      case 'closing': return 'text-yellow-400';
      case 'open': return 'text-cyan-400';
      default: return 'text-slate-400';
    }
  };
  
  const getDirectionIcon = (direction: string) => {
    if (direction === 'up') return <ArrowUp className="w-4 h-4" />;
    if (direction === 'down') return <ArrowDown className="w-4 h-4" />;
    return <span className="w-4 h-4 block" />;
  };
  
  const isTargetFloor = (floor: number) => elevator.targetFloors.includes(floor);
  const isCurrentFloor = (floor: number) => elevator.currentFloor === floor;
  
  const handleFloorButtonClick = (floor: number) => {
    if (!isTargetFloor(floor) && !isCurrentFloor(floor)) {
      addCarCall({ elevatorId, floor });
    }
  };

  return (
    <div 
      className="bg-slate-800/50 border rounded-lg p-4 space-y-3"
      style={{ borderColor: `${carColor}50` }}
    >
      <div className="flex items-center justify-between">
        <h3 
          className="text-lg font-bold"
          style={{ color: carColor }}
        >
          {elevator.name}
        </h3>
        <div className={`flex items-center gap-1 text-sm ${getStateColor(elevator.state)}`}>
          <Activity className="w-4 h-4" />
          <span>{ELEVATOR_STATE_LABELS[elevator.state]}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-center py-4 bg-slate-900/50 rounded-lg">
        <div className="text-center">
          <div 
            className="text-6xl font-bold font-mono"
            style={{ color: carColor, textShadow: `0 0 20px ${carColor}80` }}
          >
            {elevator.currentFloor}
          </div>
          <div className="text-xs text-slate-500 mt-1">当前楼层</div>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="text-xs text-slate-500">轿厢按钮</div>
        <div className="grid grid-cols-3 gap-1">
          {[5, 4, 3, 2, 1, 0].map((floor) => (
            <button
              key={floor}
              onClick={() => handleFloorButtonClick(floor)}
              disabled={isCurrentFloor(floor)}
              className={`
                py-1.5 rounded font-mono text-sm font-bold transition-all duration-200
                ${isCurrentFloor(floor) 
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                  : isTargetFloor(floor)
                    ? 'bg-cyan-500/30 border border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-700 border border-slate-600 text-slate-300 hover:border-cyan-500 hover:text-cyan-400'
                }
              `}
            >
              {floor}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className={`${elevator.direction === 'up' ? 'text-green-400' : 'text-slate-500'}`}>
            {getDirectionIcon(elevator.direction)}
          </span>
          <span className="text-slate-300">
            {ELEVATOR_DIRECTION_LABELS[elevator.direction]}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Users className="w-4 h-4" />
          <span>{elevator.passengers.length} 人</span>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-slate-400">
            <Weight className="w-4 h-4" />
            <span>载重量</span>
          </div>
          <span className={`font-mono ${isOverloaded ? 'text-red-400' : 'text-slate-300'}`}>
            {elevator.load} / {elevator.capacity} kg
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-300 rounded-full"
            style={{ 
              width: `${Math.min(loadPercent, 100)}%`,
              backgroundColor: isOverloaded ? '#ff3366' : carColor,
              boxShadow: `0 0 10px ${isOverloaded ? '#ff3366' : carColor}80`
            }}
          />
        </div>
      </div>
      
      {elevator.targetFloors.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-slate-500">目标楼层</div>
          <div className="flex flex-wrap gap-1">
            {elevator.targetFloors.map((floor, idx) => (
              <span 
                key={idx}
                className="px-2 py-0.5 bg-slate-700 text-cyan-400 text-xs rounded font-mono"
              >
                {floor}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusPanel() {
  const passengers = useElevatorStore(state => state.passengers);
  const waitingCount = passengers.filter(p => p.state === 'waiting').length;
  const ridingCount = passengers.filter(p => p.state === 'riding').length;
  const completedCount = passengers.filter(p => p.state === 'completed').length;

  return (
    <div className="w-72 bg-slate-900/90 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 border-b border-cyan-500/30 pb-3">
        <Activity className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-bold text-cyan-400">实时状态</h2>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-800/50 rounded-lg p-2 text-center border border-yellow-500/30">
          <Clock className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-yellow-400">{waitingCount}</div>
          <div className="text-xs text-slate-500">候梯</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2 text-center border border-green-500/30">
          <Users className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-green-400">{ridingCount}</div>
          <div className="text-xs text-slate-500">乘梯</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2 text-center border border-cyan-500/30">
          <Activity className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-cyan-400">{completedCount}</div>
          <div className="text-xs text-slate-500">完成</div>
        </div>
      </div>
      
      <div className="space-y-3">
        <ElevatorCard elevatorId="A" />
        <ElevatorCard elevatorId="B" />
      </div>
    </div>
  );
}
