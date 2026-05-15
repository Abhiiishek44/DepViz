import { create } from "zustand";
import { Viewport } from "reactflow";
import { BreadcrumbEntry, ViewState, ViewportByKey, VisualizerLevel } from "../types";
import { AIRenderGraph } from "../../../../shared/protocol";

type DependencyVisualizerState = {
  view: ViewState;
  selectedNodeId: string | null;
  hoveredEdgeId: string | null;
  search: string;
  zoom: number;
  isFullscreen: boolean;
  isLoading: boolean;
  history: ViewState[];
  future: ViewState[];
  viewportByKey: ViewportByKey;
  aiGraph: AIRenderGraph | null;
  selectNode: (nodeId: string | null) => void;
  setHoveredEdge: (edgeId: string | null) => void;
  setSearch: (search: string) => void;
  setZoom: (zoom: number) => void;
  setFullscreen: (isFullscreen: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setAiGraph: (graph: AIRenderGraph | null) => void;
  switchToAiView: () => void;
  saveViewport: (viewport: Viewport) => void;
  resetNavigation: () => void;
  drillToModule: (moduleId: string) => void;
  drillToFile: (fileId: string) => void;
  navigateTo: (view: ViewState) => void;
  back: () => void;
  forward: () => void;
};

const viewKey = (view: ViewState) => `${view.level}:${view.moduleId || "root"}:${view.fileId || "none"}`;

export const useDependencyVisualizerStore = create<DependencyVisualizerState>((set, get) => ({
  view: { level: "architecture" },
  selectedNodeId: null,
  hoveredEdgeId: null,
  search: "",
  zoom: 100,
  isFullscreen: false,
  isLoading: false,
  history: [],
  future: [],
  viewportByKey: {},
  aiGraph: null,
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  setHoveredEdge: (hoveredEdgeId) => set({ hoveredEdgeId }),
  setSearch: (search) => set({ search }),
  setZoom: (zoom) => set({ zoom: Math.round(zoom * 100) }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setLoading: (isLoading) => set({ isLoading }),
  setAiGraph: (aiGraph) => set({ aiGraph }),
  switchToAiView: () => {
    const { view } = get();
    if (view.level === "ai-architecture") return;
    pushView(set, get, { level: "ai-architecture" }, null);
  },
  saveViewport: (viewport) => {
    const { view, viewportByKey } = get();
    set({ viewportByKey: { ...viewportByKey, [viewKey(view)]: viewport } });
  },
  resetNavigation: () => set({
    view: { level: "architecture" },
    selectedNodeId: null,
    hoveredEdgeId: null,
    history: [],
    future: [],
    viewportByKey: {},
    aiGraph: null
  }),
  drillToModule: (moduleId) => pushView(set, get, { level: "files", moduleId }, moduleId),
  drillToFile: (fileId) => {
    const { view } = get();
    pushView(set, get, { level: "functions", moduleId: view.moduleId, fileId }, fileId);
  },
  navigateTo: (view) => pushView(set, get, view, view.fileId || view.moduleId || null),
  back: () => {
    const { history, view, future } = get();
    const previous = history.at(-1);
    if (!previous) return;

    set({
      view: previous,
      selectedNodeId: previous.fileId || previous.moduleId || null,
      history: history.slice(0, -1),
      future: [view, ...future]
    });
  },
  forward: () => {
    const { future, history, view } = get();
    const next = future[0];
    if (!next) return;

    set({
      view: next,
      selectedNodeId: next.fileId || next.moduleId || null,
      history: [...history, view],
      future: future.slice(1)
    });
  }
}));

const pushView = (
  set: (state: Partial<DependencyVisualizerState>) => void,
  get: () => DependencyVisualizerState,
  view: ViewState,
  selectedNodeId: string | null
) => {
  const current = get().view;
  if (current.level === view.level && current.moduleId === view.moduleId && current.fileId === view.fileId) {
    set({ selectedNodeId });
    return;
  }

  set({
    view,
    selectedNodeId,
    history: [...get().history, current],
    future: []
  });
};

export const getViewKey = viewKey;

export const getBreadcrumbs = (
  view: ViewState,
  moduleName?: string,
  fileName?: string
): BreadcrumbEntry[] => {
  const crumbs: BreadcrumbEntry[] = [{ level: "architecture", label: "Architecture" }];

  if (view.level === "ai-architecture") {
    crumbs.push({ level: "ai-architecture", label: "AI Architecture" });
  }

  if (view.moduleId) {
    crumbs.push({ level: "files", moduleId: view.moduleId, label: moduleName || view.moduleId });
  }

  if (view.fileId) {
    crumbs.push({ level: "functions", moduleId: view.moduleId, fileId: view.fileId, label: fileName || view.fileId });
  }

  return crumbs;
};

export const levelTitle: Record<VisualizerLevel, string> = {
  architecture: "High-Level Architecture",
  files: "Files Inside Module",
  functions: "Functions Inside File",
  "ai-architecture": "AI-Generated Architecture"
};
