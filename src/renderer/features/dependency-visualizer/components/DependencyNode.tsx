import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Cloud, Database, FileCode2, Globe2, KeyRound, Package, Shield, TerminalSquare } from "lucide-react";
import { VisualizerNodeData } from "../types";

const iconForNode = (data: VisualizerNodeData) => {
  if (data.level === "files") return <FileCode2 className="h-5 w-5" />;
  if (data.level === "functions") return <Package className="h-4 w-4" />;
  if (data.kind === "client") return <Globe2 className="h-5 w-5" />;
  if (data.kind === "gateway") return <Cloud className="h-5 w-5" />;
  if (data.kind === "database") return <Database className="h-5 w-5" />;
  if (`${data.title} ${data.subtitle}`.toLowerCase().includes("auth")) return <KeyRound className="h-5 w-5" />;
  return <Shield className="h-5 w-5" />;
};

export const DependencyNode = memo(({ data, selected }: { data: VisualizerNodeData; selected: boolean }) => (
  <div
    className="group relative min-w-[13rem] max-w-[16rem] rounded-lg border bg-[#07111f]/[0.92] px-4 py-3 text-left shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1"
    style={{
      borderColor: selected ? data.accent : `${data.accent}77`,
      boxShadow: selected
        ? `0 0 0 1px ${data.accent}55, 0 0 28px ${data.accent}44`
        : `0 0 20px ${data.accent}22`
    }}
  >
    <div
      className="pointer-events-none absolute inset-0 rounded-lg opacity-75 transition-opacity group-hover:opacity-100"
      style={{
        background: `linear-gradient(135deg, ${data.accent}22, rgba(15,23,42,0.1) 45%, transparent)`
      }}
    />
    <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-0" style={{ background: data.accent }} />
    <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-0" style={{ background: data.accent }} />

    <div className="relative flex items-center gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
        style={{ color: data.accent, borderColor: `${data.accent}55`, background: `${data.accent}18` }}
      >
        {iconForNode(data)}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-100">{data.title}</div>
        <div className="truncate text-[11px] font-medium text-slate-400">{data.subtitle}</div>
      </div>
    </div>

    <div className="relative mt-3 flex items-center justify-between gap-2 border-t border-white/[0.08] pt-2">
      <span className="truncate rounded-full border border-white/10 bg-white/[0.045] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
        {data.badge}
      </span>
      <span className="flex items-center gap-1 text-[10px] text-slate-500">
        <TerminalSquare className="h-3 w-3" />
        Drill down
      </span>
    </div>
  </div>
));
