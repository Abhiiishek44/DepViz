import { ArrowLeft, ArrowRight, ChevronRight, GitBranch } from "lucide-react";
import { BreadcrumbEntry } from "../types";

export const VisualizerBreadcrumbs = ({
  breadcrumbs,
  canBack,
  canForward,
  onBack,
  onForward,
  onNavigate
}: {
  breadcrumbs: BreadcrumbEntry[];
  canBack: boolean;
  canForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onNavigate: (entry: BreadcrumbEntry) => void;
}) => (
  <div className="flex flex-col gap-3 border-b border-white/[0.06] bg-[#08101d]/[0.88] px-4 py-3 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
    <nav className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-lg border border-white/[0.08] bg-white/[0.025] px-2 py-1.5 no-scrollbar">
      {breadcrumbs.map((crumb, index) => {
        const active = index === breadcrumbs.length - 1;
        return (
          <div key={`${crumb.level}-${crumb.moduleId || "root"}-${crumb.fileId || ""}`} className="flex items-center gap-1">
            <button
              onClick={() => onNavigate(crumb)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-200 active:scale-[0.98] ${
                active
                  ? "bg-blue-500/15 text-blue-100 ring-1 ring-blue-400/25 shadow-[0_0_18px_rgba(59,130,246,0.12)]"
                  : "text-slate-500 hover:bg-white/[0.07] hover:text-slate-200"
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span className="max-w-[13rem] truncate">{crumb.label}</span>
            </button>
            {index < breadcrumbs.length - 1 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-700" />}
          </div>
        );
      })}
    </nav>

    <div className="flex shrink-0 items-center gap-2">
      <button
        onClick={onBack}
        disabled={!canBack}
        className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[11px] font-semibold text-slate-400 transition-all hover:bg-white/[0.075] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>
      <button
        onClick={onForward}
        disabled={!canForward}
        className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[11px] font-semibold text-slate-400 transition-all hover:bg-white/[0.075] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
);
