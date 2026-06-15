import { ElevatorScene } from './components/ElevatorScene';
import { ControlPanel } from './components/ControlPanel';
import { StatusPanel } from './components/StatusPanel';
import { StatsPanel } from './components/StatsPanel';
import { HallCallButtons } from './components/HallCallButtons';
import { Building2 } from 'lucide-react';

export default function App() {
  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      <header className="h-14 bg-slate-900/90 border-b border-cyan-500/30 flex items-center px-6 gap-3 z-20">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-cyan-400">电梯群控系统模拟器</h1>
          <p className="text-xs text-slate-500">Elevator Group Control System Simulator</p>
        </div>
        <div className="ml-auto flex items-center gap-4 text-sm text-slate-400">
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700">6层建筑</span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700">2部电梯</span>
          <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700">3种调度策略</span>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden relative">
        <aside className="w-72 p-4 flex-shrink-0 overflow-y-auto scrollbar-thin">
          <ControlPanel />
        </aside>
        
        <main className="flex-1 relative">
          <HallCallButtons />
          <ElevatorScene />
        </main>
        
        <aside className="w-72 p-4 flex-shrink-0 overflow-y-auto scrollbar-thin">
          <StatusPanel />
        </aside>
      </div>
      
      <footer className="h-auto p-4 bg-slate-900/90 border-t border-cyan-500/30 z-20">
        <StatsPanel />
      </footer>
    </div>
  );
}
