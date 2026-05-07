import { RefreshCw, Search, Moon, Settings, Code2 } from 'lucide-react';

export const Toolbar = ({ onRefresh, onSelectProject, projectStatus }: { onRefresh: () => void, onSelectProject: () => void, projectStatus: string }) => {
  return (
    <div className="h-14 bg-dark-900 border-b border-zinc-800 flex items-center justify-between px-4 text-gray-200">
      <div className="flex items-center gap-3">
        <Code2 className="w-6 h-6 text-cyan-400" />
        <h1 className="font-semibold tracking-wide text-sm">Code Dependency Visualizer</h1>
      </div>
      
      <div className="flex-1 flex justify-center">
        <span className="text-xs text-zinc-400 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
          {projectStatus || "No project loaded"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={onSelectProject}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-gray-200 rounded-md transition-colors"
        >
          Select Project
        </button>
        <div className="w-px h-5 bg-zinc-800 mx-2"></div>
        <button onClick={onRefresh} className="p-2 hover:bg-zinc-800 rounded-md transition-colors group">
          <RefreshCw className="w-4 h-4 text-zinc-400 group-hover:text-gray-200" />
        </button>
        <button className="p-2 hover:bg-zinc-800 rounded-md transition-colors group">
          <Search className="w-4 h-4 text-zinc-400 group-hover:text-gray-200" />
        </button>
        <button className="p-2 hover:bg-zinc-800 rounded-md transition-colors group">
          <Moon className="w-4 h-4 text-zinc-400 group-hover:text-gray-200" />
        </button>
        <button className="p-2 hover:bg-zinc-800 rounded-md transition-colors group">
          <Settings className="w-4 h-4 text-zinc-400 group-hover:text-gray-200" />
        </button>
      </div>
    </div>
  );
};
