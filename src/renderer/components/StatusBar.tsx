import { Activity } from 'lucide-react';

export const StatusBar = ({ projectName, fileCount, functionCount, lastScan }: { projectName: string; fileCount: number; functionCount: number; lastScan: string }) => {
  return (
    <div className="h-6 bg-dark-900 border-t border-zinc-800 flex items-center justify-between px-3 text-[10px] text-zinc-400 font-medium">
      <div className="flex items-center gap-4">
        <span>Project: {projectName || 'None'}</span>
        <span>Total Files: {fileCount}</span>
        <span>Total Functions: {functionCount}</span>
        <span>Last Scan: {lastScan || 'N/A'}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-500 text-[10px]">Watching for changes</span>
        </div>
        <Activity className="w-3 h-3 text-zinc-500" />
      </div>
    </div>
  );
};
