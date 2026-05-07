import { RefreshCw, Search, Moon, Settings, Code2, Bell, LayoutGrid } from 'lucide-react';

export const Toolbar = ({ 
  onRefresh, 
  onSelectProject, 
  projectStatus 
}: { 
  onRefresh: () => void, 
  onSelectProject: () => void, 
  projectStatus: string 
}) => {
  return (
    <div className="h-12 bg-dark-900/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Code2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <h1 className="font-bold tracking-tight text-xs text-white/90">DepViz</h1>
          <span className="text-[10px] text-zinc-500 font-medium leading-none">Code Dependency Visualizer</span>
        </div>
      </div>
      
      <div className="flex-1 flex justify-center max-w-xl mx-8">
        <div className="w-full relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search nodes, files, or functions... (⌘K)" 
            className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-[11px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white/10 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={onRefresh} 
          className="p-1.5 hover:bg-white/10 rounded-md transition-all group relative"
          title="Refresh Graph"
        >
          <RefreshCw className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200" />
        </button>
        
        <div className="w-px h-4 bg-white/10 mx-1"></div>
        
        <button className="p-1.5 hover:bg-white/10 rounded-md transition-all text-zinc-400 hover:text-zinc-200">
          <Moon className="w-4 h-4" />
        </button>
        <button className="p-1.5 hover:bg-white/10 rounded-md transition-all text-zinc-400 hover:text-zinc-200">
          <Settings className="w-4 h-4" />
        </button>
        
        <button 
          onClick={onSelectProject}
          className="ml-2 px-3 py-1.5 text-[11px] font-semibold bg-blue-600/90 hover:bg-blue-600 text-white rounded-md transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          Open Project
        </button>
      </div>
    </div>
  );
};

