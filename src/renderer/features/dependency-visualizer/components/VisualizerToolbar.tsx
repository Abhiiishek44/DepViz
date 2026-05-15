import { FolderOpen, Maximize2, Minimize2, Moon, RefreshCw, Search, Settings, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { useDependencyVisualizerStore } from "../store/useDependencyVisualizerStore";

export const VisualizerToolbar = ({
  onOpenProject,
  onRefresh,
  projectName,
  status
}: {
  onOpenProject: () => void;
  onRefresh: () => void;
  projectName: string;
  status: string;
}) => {
  const search = useDependencyVisualizerStore((state) => state.search);
  const setSearch = useDependencyVisualizerStore((state) => state.setSearch);
  const isFullscreen = useDependencyVisualizerStore((state) => state.isFullscreen);
  const setFullscreen = useDependencyVisualizerStore((state) => state.setFullscreen);
  const inputRef = useRef<HTMLInputElement>(null);
  const { aiGraph, setAiGraph, switchToAiView, setLoading } = useDependencyVisualizerStore();

  const handleGenerateAI = async () => {
    if (!projectName) {
      alert("Please open a project first.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await window.api.generateAiArchitecture();
      if (res.error) {
        alert(res.error);
        return;
      }
      setAiGraph(res.graph);
      switchToAiView();
    } catch (err) {
      console.error(err);
      alert("Failed to generate AI architecture.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setSearch("");
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setSearch]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
      setFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#07111f]/[0.92] px-4 shadow-[0_14px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-sky-400 text-white shadow-[0_0_24px_rgba(96,165,250,0.32)]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white">Code Dependency Visualizer</h1>
          <p className="text-[10px] font-medium text-slate-500">{projectName || status || "Open a project to scan real code"}</p>
        </div>
      </div>

      <div className="flex flex-1 justify-end gap-2">
        <div className="relative hidden w-full max-w-sm md:block">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            ref={inputRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search nodes (⌘K)"
            className="h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.045] pl-9 pr-3 text-xs text-slate-200 outline-none transition focus:border-blue-400/35 focus:bg-white/[0.075]"
          />
        </div>
        <IconButton onClick={toggleFullscreen} title="Toggle fullscreen">
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </IconButton>
        <IconButton onClick={onRefresh} title="Refresh graph">
          <RefreshCw className="h-4 w-4" />
        </IconButton>
        <IconButton title="Theme">
          <Moon className="h-4 w-4" />
        </IconButton>
        <IconButton title="Settings">
          <Settings className="h-4 w-4" />
        </IconButton>
        <button
          onClick={handleGenerateAI}
          className="ml-1 flex h-8 items-center gap-2 rounded-lg border border-purple-400/25 bg-purple-500/15 px-3 text-xs font-bold text-purple-200 transition hover:bg-purple-500/25 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Architecture
        </button>
        <button
          onClick={onOpenProject}
          className="ml-1 flex h-8 items-center gap-2 rounded-lg border border-blue-400/25 bg-blue-500/15 px-3 text-xs font-semibold text-blue-100 transition hover:bg-blue-500/25"
        >
          <FolderOpen className="h-4 w-4" />
          Open Project
        </button>
      </div>
    </header>
  );
};

const IconButton = ({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title: string }) => (
  <button
    onClick={onClick}
    title={title}
    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.045] text-slate-400 transition hover:border-blue-400/25 hover:bg-white/[0.075] hover:text-white"
  >
    {children}
  </button>
);
