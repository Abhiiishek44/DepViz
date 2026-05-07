import React from 'react';
import { ChevronRight, RotateCcw, ArrowLeft, Layout, ChevronDown } from 'lucide-react';

interface BreadcrumbNavProps {
  breadcrumbs: string[];
  onBack?: () => void;
  onResetView?: () => void;
  onLayoutChange?: (layout: string) => void;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  breadcrumbs,
  onBack,
  onResetView,
  onLayoutChange
}) => {
  return (
    <div className="flex flex-col gap-3 p-4 bg-[#0b0f1a] border-b border-white/5">

      {/* Top Row: Breadcrumbs and Layout Dropdown */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {breadcrumbs.length > 0 ? (
            breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <React.Fragment key={index}>
                  <button
                    className={`
                      text-[11px] font-medium transition-all px-1.5 py-0.5 rounded-md relative group/crumb
                      ${isLast 
                        ? 'text-blue-400 font-bold bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 active:scale-95'}
                    `}
                  >
                    {crumb}
                    {isLast && (
                      <span className="absolute -bottom-px left-1.5 right-1.5 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                    )}
                  </button>

                  {!isLast && (
                    <ChevronRight className="w-3 h-3 text-zinc-700" />
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <span className="text-[11px] text-zinc-600 font-medium px-1.5 py-0.5">
              Select a node to begin
            </span>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative group">
            <button
              onClick={() => onLayoutChange?.('dagre')}
              className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-md transition-all active:scale-95 group"
            >
              <Layout className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
              <span>Layout</span>
              <ChevronDown className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
            </button>
            {/* Simple dropdown indicator - actual dropdown logic can be added later */}
          </div>
        </div>
      </div>

      {/* Bottom Row: Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-white/5 rounded-md transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
        <button
          onClick={onResetView}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-white/5 rounded-md transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset View</span>
        </button>
      </div>
    </div>
  );
};
