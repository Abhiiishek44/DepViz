import React from 'react';
import { ArrowLeft, ChevronRight, FileCode2, Folder, Layout, RotateCcw, TerminalSquare } from 'lucide-react';
import { BreadcrumbItem } from '../features/graph/types/graphTypes';

interface BreadcrumbNavProps {
  breadcrumbs: BreadcrumbItem[];
  onBreadcrumbSelect?: (item: BreadcrumbItem) => void;
  onBack?: () => void;
  onResetView?: () => void;
  onLayoutChange?: (layout: string) => void;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  breadcrumbs,
  onBreadcrumbSelect,
  onBack,
  onResetView,
  onLayoutChange
}) => {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 bg-[#0b0f1a]/95 border-b border-white/5 shadow-[0_12px_35px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex min-w-0 items-center gap-1.5 overflow-x-auto rounded-lg border border-white/5 bg-white/[0.025] px-2 py-1.5 no-scrollbar">
          {breadcrumbs.length > 0 ? (
            breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.id}>
                  <button
                    onClick={() => onBreadcrumbSelect?.(crumb)}
                    className={`
                      group/crumb relative flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-200 active:scale-[0.98]
                      ${isLast 
                        ? 'bg-blue-500/15 text-blue-200 shadow-[0_0_18px_rgba(59,130,246,0.16)] ring-1 ring-blue-400/20' 
                        : 'text-zinc-500 hover:bg-white/[0.07] hover:text-zinc-200 hover:shadow-[0_0_14px_rgba(255,255,255,0.05)]'}
                    `}
                    title={crumb.label}
                  >
                    <BreadcrumbIcon item={crumb} active={isLast} />
                    <span className="max-w-[11rem] truncate tracking-normal">{crumb.label}</span>
                    {isLast && (
                      <span className="absolute -bottom-px left-2 right-2 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
                    )}
                  </button>

                  {!isLast && (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-700" />
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <span className="px-2.5 py-1.5 text-[11px] font-medium text-zinc-600">
              Select a node to begin
            </span>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <IconButton onClick={onBack} title="Previous level">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </IconButton>
          <IconButton onClick={onResetView} title="Fit graph">
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </IconButton>
          <IconButton onClick={() => onLayoutChange?.('dagre-lr')} title="Dagre left-to-right layout">
            <Layout className="h-3.5 w-3.5" />
            <span>LR Layout</span>
          </IconButton>
        </div>
      </div>
    </div>
  );
};

const BreadcrumbIcon = ({ item, active }: { item: BreadcrumbItem; active: boolean }) => {
  const className = `h-3.5 w-3.5 shrink-0 transition-colors ${
    active ? "text-blue-200" : "text-zinc-600 group-hover/crumb:text-zinc-300"
  }`;

  if (item.type === "folder") {
    return <Folder className={className} />;
  }

  if (item.type === "file") {
    return <FileCode2 className={className} />;
  }

  return <TerminalSquare className={className} />;
};

const IconButton = ({
  children,
  onClick,
  title
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title: string;
}) => (
  <button
    onClick={onClick}
    title={title}
    className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[11px] font-semibold text-zinc-400 transition-all duration-200 hover:border-blue-400/20 hover:bg-white/[0.075] hover:text-zinc-100 hover:shadow-[0_0_16px_rgba(59,130,246,0.08)] active:scale-[0.98]"
  >
    {children}
  </button>
);
