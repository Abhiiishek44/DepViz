import { Activity, Boxes, Clock, FileCode2, GitMerge, Info, Network } from "lucide-react";
import { getInspectableEntity } from "../lib/graphBuilders";
import { useDependencyVisualizerStore } from "../store/useDependencyVisualizerStore";
import { RealProjectModel } from "../types";

export const MetadataPanel = ({ model }: { model: RealProjectModel | null }) => {
  const selectedNodeId = useDependencyVisualizerStore((state) => state.selectedNodeId);
  const entity = getInspectableEntity(model, selectedNodeId);

  if (!entity) {
    return (
      <aside className="hidden w-80 shrink-0 border-l border-white/[0.08] bg-[#08101d]/[0.84] p-5 backdrop-blur-xl xl:block">
        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-white/[0.08] text-center text-sm text-slate-500">
          Select a node to inspect metadata
        </div>
      </aside>
    );
  }

  const title = entity.name;
  const rows = getRows(entity);

  return (
    <aside className="hidden w-80 shrink-0 border-l border-white/[0.08] bg-[#08101d]/[0.84] backdrop-blur-xl xl:flex xl:flex-col">
      <div className="border-b border-white/[0.08] p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-400/30 bg-blue-400/10 text-blue-200">
            <Info className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-white">{title}</h2>
            <p className="truncate text-xs text-slate-500">{getSubtitle(entity)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="rounded-lg border border-white/[0.07] bg-white/[0.035] p-3">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {row.icon}
                {row.label}
              </div>
              <div className="text-sm font-medium text-slate-200">{row.value}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

const getSubtitle = (entity: NonNullable<ReturnType<typeof getInspectableEntity>>) => {
  if ("subtitle" in entity) return entity.subtitle;
  if ("path" in entity) return entity.path;
  return entity.signature;
};

const getRows = (entity: NonNullable<ReturnType<typeof getInspectableEntity>>) => {
  if ("owner" in entity) {
    return [
      { label: "Type", value: entity.kind, icon: <Boxes className="h-3.5 w-3.5" /> },
      { label: "Owner", value: entity.owner, icon: <Activity className="h-3.5 w-3.5" /> },
      { label: "Files", value: entity.files.length, icon: <FileCode2 className="h-3.5 w-3.5" /> },
      { label: "Dependencies", value: entity.dependencies.length, icon: <Network className="h-3.5 w-3.5" /> }
    ];
  }

  if ("imports" in entity) {
    return [
      { label: "Path", value: entity.path, icon: <FileCode2 className="h-3.5 w-3.5" /> },
      { label: "Imports", value: entity.imports.length, icon: <GitMerge className="h-3.5 w-3.5" /> },
      { label: "Functions", value: entity.functions.length, icon: <Boxes className="h-3.5 w-3.5" /> },
      { label: "Modified", value: entity.modified, icon: <Clock className="h-3.5 w-3.5" /> }
    ];
  }

  return [
    { label: "Type", value: entity.type, icon: <Boxes className="h-3.5 w-3.5" /> },
    { label: "Lines", value: entity.lines, icon: <FileCode2 className="h-3.5 w-3.5" /> },
    { label: "Calls", value: entity.calls.length, icon: <Network className="h-3.5 w-3.5" /> },
    { label: "Called By", value: entity.calledBy.length, icon: <GitMerge className="h-3.5 w-3.5" /> },
    { label: "Dependencies", value: entity.dependencies.join(", ") || "None", icon: <Activity className="h-3.5 w-3.5" /> }
  ];
};
