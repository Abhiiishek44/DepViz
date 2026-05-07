import { Handle, Position } from "reactflow";
import { Folder, FileCode2, TerminalSquare, Box } from "lucide-react";
import clsx from "clsx";

export const FolderNode = ({ data, selected }: any) => {
  return (
    <div className={clsx("rounded-xl border-2 shadow-lg backdrop-blur-md transition-all duration-300 w-64", 
      selected ? "border-blue-400 bg-blue-900/40 shadow-[0_0_15px_rgba(96,165,250,0.5)]" : "border-blue-900/50 bg-slate-900/80 hover:border-blue-700/80")}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="p-3 flex flex-col gap-2 relative">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Folder className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-gray-200 font-semibold text-sm leading-none">{data.name}</h3>
            <p className="text-zinc-400 text-[10px] mt-1">{data.filesCount} files</p>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

export const FileNode = ({ data, selected }: any) => {
  return (
    <div className={clsx("rounded-xl border-2 shadow-lg backdrop-blur-md transition-all duration-300 w-56", 
      selected ? "border-emerald-400 bg-emerald-900/40 shadow-[0_0_15px_rgba(52,211,153,0.5)]" : "border-emerald-900/50 bg-slate-900/80 hover:border-emerald-700/80")}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="p-3">
        <div className="flex items-center gap-3 border-b border-zinc-700/50 pb-2 mb-2">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <FileCode2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-gray-200 font-medium text-xs truncate">{data.name}</h3>
            <p className="text-zinc-500 text-[9px] truncate">{data.path}</p>
          </div>
        </div>
        <div className="flex justify-between items-center px-1">
          <div className="text-[9px] text-zinc-400">
            <span className="text-emerald-400 font-mono">{data.functionsCount}</span> fns
          </div>
          <div className="text-[9px] text-zinc-400">
            <span className="text-orange-400 font-mono">{data.importsCount}</span> imports
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

export const FunctionNode = ({ data, selected }: any) => {
  return (
    <div className={clsx("rounded-xl border-2 shadow-lg backdrop-blur-md transition-all duration-300 w-48", 
      selected ? "border-purple-400 bg-purple-900/40 shadow-[0_0_15px_rgba(192,132,252,0.5)]" : "border-purple-900/50 bg-slate-900/80 hover:border-purple-700/80")}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="p-3 flex items-center gap-3">
        <div className="p-1.5 bg-purple-500/20 rounded-md">
          <TerminalSquare className="w-4 h-4 text-purple-400" />
        </div>
        <div className="overflow-hidden">
          <h3 className="text-gray-200 font-mono text-xs truncate">{data.name}()</h3>
          <p className="text-zinc-500 text-[8px] truncate">calls: {data.callsCount} | params: {data.paramsCount}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

export const ExternalNode = ({ data, selected }: any) => {
  return (
    <div className={clsx("rounded-xl border-2 shadow-lg backdrop-blur-md transition-all duration-300 w-40", 
      selected ? "border-orange-400 bg-orange-900/40 shadow-[0_0_15px_rgba(251,146,60,0.5)]" : "border-orange-900/50 bg-slate-900/80 hover:border-orange-700/80")}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="p-2 gap-2 flex items-center">
        <Box className="w-4 h-4 text-orange-400" />
        <h3 className="text-gray-200 font-semibold text-xs truncate">{data.name}</h3>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

export const nodeTypes = {
  folder: FolderNode,
  file: FileNode,
  function: FunctionNode,
  external: ExternalNode
};
