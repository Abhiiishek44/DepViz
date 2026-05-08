import { ChevronDown, ChevronRight, FileCode2, Folder, PackageOpen } from "lucide-react";
import { useDependencyVisualizerStore } from "../store/useDependencyVisualizerStore";
import { RealProjectModel } from "../types";

export const ProjectExplorer = ({ model }: { model: RealProjectModel | null }) => {
  const view = useDependencyVisualizerStore((state) => state.view);
  const drillToModule = useDependencyVisualizerStore((state) => state.drillToModule);
  const drillToFile = useDependencyVisualizerStore((state) => state.drillToFile);
  const selectedNodeId = useDependencyVisualizerStore((state) => state.selectedNodeId);

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/[0.08] bg-[#08101d]/[0.86] backdrop-blur-xl lg:flex lg:flex-col">
      <div className="flex h-12 items-center justify-between border-b border-white/[0.08] px-4">
        <span className="text-xs font-semibold text-slate-100">Project Explorer</span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 text-xs text-slate-400">
        <div className="mb-3 flex items-center gap-2 text-slate-200">
          <Folder className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold">{model?.projectName || "No project loaded"}</span>
        </div>

        {!model ? (
          <div className="rounded-lg border border-dashed border-white/[0.08] p-3 text-slate-500">
            Open a project to scan real files.
          </div>
        ) : (
        <div className="space-y-1">
          {model.modules.map((module) => {
            const activeModule = view.moduleId === module.id || selectedNodeId === module.id;
            return (
              <div key={module.id}>
                <button
                  onClick={() => drillToModule(module.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                    activeModule ? "bg-white/[0.08] text-white" : "hover:bg-white/[0.05] hover:text-slate-200"
                  }`}
                >
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                  <PackageOpen className="h-3.5 w-3.5" style={{ color: module.accent }} />
                  <span className="truncate">{module.name}</span>
                </button>

                {view.moduleId === module.id && (
                  <div className="ml-7 mt-1 space-y-1 border-l border-white/[0.06] pl-2">
                    {model.files.filter((item) => item.moduleId === module.id).map((file) => {
                      return (
                        <button
                          key={file.id}
                          onClick={() => drillToFile(file.id)}
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                            view.fileId === file.id ? "bg-blue-500/15 text-blue-100" : "hover:bg-white/[0.05] hover:text-slate-200"
                          }`}
                        >
                          <FileCode2 className="h-3.5 w-3.5 text-blue-300" />
                          <span className="truncate">{file.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>
    </aside>
  );
};
