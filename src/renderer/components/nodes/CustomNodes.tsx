import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Folder, FileCode2, Box, PackageOpen } from "lucide-react";

// --- HANDLES ---

const UniversalHandle = ({ type, position, color }: { type: 'source' | 'target', position: Position, color: string }) => (
  <Handle 
    type={type} 
    position={position} 
    className={`!w-2 !h-2 border-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${color}`} 
  />
);

// --- 1. FOLDER NODE (CYAN) ---

export const FolderNodeComponent = memo(({ data }: any) => (
  <div className="w-64 relative group rounded-xl bg-[#0b1020]/90 backdrop-blur-md border border-[#00c8ff]/50 p-4 text-left transition-all duration-300 shadow-[0_0_15px_rgba(0,180,255,0.2)] hover:shadow-[0_0_25px_rgba(0,180,255,0.4)] hover:scale-[1.03] before:absolute before:inset-0 before:bg-[#00b4ff]/[0.08] before:rounded-xl before:z-[-1]">
    <UniversalHandle type="target" position={Position.Top} color="!bg-[#00c8ff]" />
    
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-[#00c8ff]/10">
        <Folder className="w-5 h-5 text-[#00c8ff]" strokeWidth={2} />
      </div>
      <strong className="text-slate-100 text-[15px] font-semibold tracking-wide truncate">{data.label}</strong>
    </div>

    <div className="flex justify-between items-center text-[11px] font-medium text-[#00c8ff]/70 mt-4 pt-3 border-t border-[#00c8ff]/20">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#00c8ff] shadow-[0_0_5px_#00c8ff]"></div>
        <span className="uppercase tracking-widest">Folders: {data.foldersCount}</span>
      </div>
      <span className="uppercase tracking-widest">Files: {data.filesCount}</span>
    </div>

    <UniversalHandle type="source" position={Position.Bottom} color="!bg-[#00c8ff]" />
  </div>
));

// --- 2. FILE NODE (GREEN) ---

export const FileNodeComponent = memo(({ data }: any) => (
  <div className="w-56 relative group rounded-xl bg-[#0b1020]/90 backdrop-blur-md border border-[#00ff78]/45 p-3.5 text-left transition-all duration-300 shadow-[0_0_12px_rgba(0,255,140,0.15)] hover:shadow-[0_0_20px_rgba(0,255,140,0.3)] hover:-translate-y-1 before:absolute before:inset-0 before:bg-[#00ff8c]/[0.08] before:rounded-xl before:z-[-1] overflow-hidden">
    {/* Top neon highlight line */}
    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00ff78] to-transparent opacity-50"></div>
    
    <UniversalHandle type="target" position={Position.Top} color="!bg-[#00ff78]" />
    
    <div className="flex items-start gap-2.5 mb-2">
      <div className="mt-0.5">
        <FileCode2 className="w-5 h-5 text-[#00ff8c]" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col min-w-0">
        <strong className="text-slate-200 text-[13px] font-medium truncate">{data.name}</strong>
        <span className="text-[#00ff8c]/60 text-[10px] font-mono truncate mt-0.5">{data.parentPath}</span>
      </div>
    </div>

    <div className="flex justify-between items-center text-[10px] font-semibold text-[#00ff8c]/70 mt-3 pt-2.5 border-t border-[#00ff78]/20">
      <span className="uppercase tracking-widest">Imports: {data.importsCount}</span>
      <span className="uppercase tracking-widest">Fns: {data.functionsCount}</span>
    </div>

    <UniversalHandle type="source" position={Position.Bottom} color="!bg-[#00ff78]" />
  </div>
));

// --- 3. FUNCTION NODE (PURPLE) ---

export const FunctionNodeComponent = memo(({ data }: any) => (
  <div className="w-48 relative group rounded-full bg-[#0b1020]/90 backdrop-blur-md border border-[#b450ff]/50 px-4 py-2.5 text-left transition-all duration-300 shadow-[0_0_10px_rgba(180,80,255,0.15)] hover:shadow-[0_0_20px_rgba(180,80,255,0.4)] hover:border-[#b450ff]/80 before:absolute before:inset-0 before:bg-[#b450ff]/[0.08] before:rounded-full before:z-[-1]">
    <UniversalHandle type="target" position={Position.Top} color="!bg-[#b450ff]" />
    
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Box className="w-4 h-4 text-[#b450ff] flex-shrink-0" strokeWidth={2} />
        <strong className="text-slate-200 text-[12px] font-mono truncate">{data.name}()</strong>
      </div>
      
      {/* Animated Pulse Dot */}
      <div className="relative flex h-2 w-2 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b450ff] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#b450ff]"></span>
      </div>
    </div>
    
    <UniversalHandle type="source" position={Position.Bottom} color="!bg-[#b450ff]" />
  </div>
));

// --- 4. EXTERNAL NODE (ORANGE / YELLOW) -- (Placeholder if you add this)
export const ExternalNodeComponent = memo(({ data }: any) => (
  <div className="w-40 relative group rounded-lg bg-[#0b1020]/90 backdrop-blur-md border-2 border-dashed border-[#ff9500]/60 px-3 py-2 text-center transition-all duration-300 shadow-[0_0_10px_rgba(255,149,0,0.1)] hover:shadow-[0_0_20px_rgba(255,149,0,0.3)] before:absolute before:inset-0 before:bg-[#ff9500]/[0.05] before:rounded-lg before:z-[-1]">
    <UniversalHandle type="target" position={Position.Top} color="!bg-[#ff9500]" />
    <div className="flex items-center justify-center gap-2">
      <PackageOpen className="w-4 h-4 text-[#ff9500]" />
      <strong className="text-orange-200 text-[11px] font-semibold tracking-wide truncate">{data.name}</strong>
    </div>
    <UniversalHandle type="source" position={Position.Bottom} color="!bg-[#ff9500]" />
  </div>
));
