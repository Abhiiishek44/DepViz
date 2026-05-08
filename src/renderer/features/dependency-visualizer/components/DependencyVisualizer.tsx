import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  MiniMap,
  Node,
  ReactFlowInstance,
  Viewport
} from "reactflow";
import { Loader2, Minus, Plus, ScanSearch } from "lucide-react";
import { AnimatedDependencyEdge } from "./AnimatedDependencyEdge";
import { DependencyNode } from "./DependencyNode";
import { MetadataPanel } from "./MetadataPanel";
import { ProjectExplorer } from "./ProjectExplorer";
import { VisualizerBreadcrumbs } from "./VisualizerBreadcrumbs";
import { VisualizerToolbar } from "./VisualizerToolbar";
import { useProjectGraph } from "../../../app/useProjectGraph";
import { buildGraphForView, findFile, findModule, getGraphTitle, getLevelDescription } from "../lib/graphBuilders";
import { createProjectModel } from "../lib/projectModel";
import { useDebouncedValue } from "../lib/useDebouncedValue";
import {
  getBreadcrumbs,
  getViewKey,
  levelTitle,
  useDependencyVisualizerStore
} from "../store/useDependencyVisualizerStore";
import { BreadcrumbEntry } from "../types";

const nodeTypes = { dependencyNode: DependencyNode };
const edgeTypes = { animatedDependency: AnimatedDependencyEdge };

export const DependencyVisualizer = () => {
  const view = useDependencyVisualizerStore((state) => state.view);
  const search = useDependencyVisualizerStore((state) => state.search);
  const selectedNodeId = useDependencyVisualizerStore((state) => state.selectedNodeId);
  const hoveredEdgeId = useDependencyVisualizerStore((state) => state.hoveredEdgeId);
  const history = useDependencyVisualizerStore((state) => state.history);
  const future = useDependencyVisualizerStore((state) => state.future);
  const viewportByKey = useDependencyVisualizerStore((state) => state.viewportByKey);
  const isLoading = useDependencyVisualizerStore((state) => state.isLoading);
  const selectNode = useDependencyVisualizerStore((state) => state.selectNode);
  const setHoveredEdge = useDependencyVisualizerStore((state) => state.setHoveredEdge);
  const setZoom = useDependencyVisualizerStore((state) => state.setZoom);
  const saveViewport = useDependencyVisualizerStore((state) => state.saveViewport);
  const drillToModule = useDependencyVisualizerStore((state) => state.drillToModule);
  const drillToFile = useDependencyVisualizerStore((state) => state.drillToFile);
  const navigateTo = useDependencyVisualizerStore((state) => state.navigateTo);
  const back = useDependencyVisualizerStore((state) => state.back);
  const forward = useDependencyVisualizerStore((state) => state.forward);
  const setLoading = useDependencyVisualizerStore((state) => state.setLoading);
  const resetNavigation = useDependencyVisualizerStore((state) => state.resetNavigation);
  const { graph: projectGraph, lastScan, loadProject, projectName, refreshGraph, status } = useProjectGraph();
  const debouncedSearch = useDebouncedValue(search);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const model = useMemo(
    () => projectGraph ? createProjectModel(projectGraph, projectName || "Project") : null,
    [projectGraph, projectName]
  );

  const module = view.moduleId ? findModule(model, view.moduleId) : undefined;
  const file = view.fileId ? findFile(model, view.fileId) : undefined;
  const breadcrumbs = useMemo(
    () => getBreadcrumbs(view, module?.name, file?.name),
    [file?.name, module?.name, view]
  );
  const graph = useMemo(
    () => buildGraphForView(model, view, debouncedSearch, hoveredEdgeId),
    [debouncedSearch, hoveredEdgeId, model, view]
  );

  // Drill-down flow: module -> files -> functions. The short loading state makes transitions feel intentional.
  const handleNodeClick = useCallback((_: unknown, node: Node) => {
    selectNode(node.id);

    if (view.level === "architecture") {
      setLoading(true);
      window.setTimeout(() => {
        drillToModule(node.id);
        setLoading(false);
      }, 180);
    }

    if (view.level === "files") {
      setLoading(true);
      window.setTimeout(() => {
        drillToFile(node.id);
        setLoading(false);
      }, 180);
    }
  }, [drillToFile, drillToModule, selectNode, setLoading, view.level]);

  const handleBreadcrumbNavigate = useCallback((entry: BreadcrumbEntry) => {
    navigateTo({ level: entry.level, moduleId: entry.moduleId, fileId: entry.fileId });
  }, [navigateTo]);

  const handleOpenProject = useCallback(async () => {
    resetNavigation();
    await loadProject();
  }, [loadProject, resetNavigation]);

  const handleMoveEnd = useCallback((_: MouseEvent | TouchEvent | null, viewport: Viewport) => {
    setZoom(viewport.zoom);
    saveViewport(viewport);
  }, [saveViewport, setZoom]);

  useEffect(() => {
    if (!rfInstance) return;

    const key = getViewKey(view);
    const savedViewport = viewportByKey[key];

    window.setTimeout(() => {
      if (savedViewport) {
        rfInstance.setViewport(savedViewport, { duration: 360 });
      } else {
        rfInstance.fitView({ padding: 0.24, duration: 520 });
      }
    }, 40);
  }, [graph.nodes, rfInstance, view, viewportByKey]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === "ArrowLeft") back();
      if (event.altKey && event.key === "ArrowRight") forward();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [back, forward]);

  const displayNodes = useMemo(
    () =>
      graph.nodes.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId
      })),
    [graph.nodes, selectedNodeId]
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#030813] text-slate-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(88,28,135,0.18),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.14),transparent_34%)]" />
      <div className="relative flex h-full flex-col">
        <VisualizerToolbar
          onOpenProject={handleOpenProject}
          onRefresh={refreshGraph}
          projectName={projectName}
          status={status}
        />
        <VisualizerBreadcrumbs
          breadcrumbs={breadcrumbs}
          canBack={history.length > 0}
          canForward={future.length > 0}
          onBack={back}
          onForward={forward}
          onNavigate={handleBreadcrumbNavigate}
        />

        <div className="flex min-h-0 flex-1">
          <ProjectExplorer model={model} />

          <main className="relative min-w-0 flex-1 overflow-hidden bg-[#050b16]">
            <div className="pointer-events-none absolute left-5 top-5 z-20">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{levelTitle[view.level]}</p>
              <h2 className="mt-1 text-lg font-bold text-white">{getGraphTitle(model, view)}</h2>
              <p className="mt-1 max-w-xl text-xs text-slate-500">{getLevelDescription(view)}</p>
              {lastScan && <p className="mt-1 text-[10px] text-slate-600">Last scan: {lastScan}</p>}
            </div>

            {model ? (
            <ReactFlow
              nodes={displayNodes}
              edges={graph.edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              minZoom={0.15}
              maxZoom={2.2}
              panOnScroll
              selectionOnDrag
              onInit={setRfInstance}
              onNodeClick={handleNodeClick}
              onEdgeMouseEnter={(_, edge: Edge) => setHoveredEdge(edge.id)}
              onEdgeMouseLeave={() => setHoveredEdge(null)}
              onMoveEnd={handleMoveEnd}
            >
              <Background gap={22} color="rgba(148, 163, 184, 0.08)" />
              <Controls className="!bottom-5 !left-5 rounded-lg !border !border-white/[0.08] !bg-[#07111f]/90 !shadow-xl" />
              <MiniMap
                pannable
                zoomable
                nodeColor={(node) => node.data?.accent || "#60a5fa"}
                maskColor="rgba(3, 8, 19, 0.78)"
                className="!bottom-5 !right-5 !rounded-lg !border !border-white/[0.08] !bg-[#07111f]/90"
              />
            </ReactFlow>
            ) : (
              <EmptyProjectState onOpenProject={handleOpenProject} />
            )}

            <ZoomHud />
            <FlowHint />

            {isLoading && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#030813]/45 backdrop-blur-sm">
                <div className="flex items-center gap-3 rounded-lg border border-blue-400/25 bg-[#07111f]/90 px-4 py-3 text-sm font-semibold text-blue-100 shadow-[0_0_35px_rgba(59,130,246,0.2)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading graph level
                </div>
              </div>
            )}
          </main>

          <MetadataPanel model={model} />
        </div>
      </div>
    </div>
  );
};

const ZoomHud = () => {
  const zoom = useDependencyVisualizerStore((state) => state.zoom);
  return (
    <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-white/[0.08] bg-[#07111f]/90 px-3 py-2 text-xs font-semibold text-slate-300 shadow-xl backdrop-blur">
      <Minus className="h-3.5 w-3.5 text-slate-500" />
      <span>{zoom}%</span>
      <Plus className="h-3.5 w-3.5 text-slate-500" />
    </div>
  );
};

const FlowHint = () => (
  <div className="pointer-events-none absolute bottom-5 right-48 z-20 hidden rounded-lg border border-white/[0.08] bg-[#07111f]/80 px-3 py-2 text-[11px] text-slate-500 backdrop-blur xl:flex xl:items-center xl:gap-2">
    <ScanSearch className="h-3.5 w-3.5" />
    Click nodes to drill down. Hover edges to highlight flow.
  </div>
);

const EmptyProjectState = ({ onOpenProject }: { onOpenProject: () => void }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="max-w-md rounded-xl border border-white/[0.08] bg-[#07111f]/90 p-6 text-center shadow-[0_0_45px_rgba(59,130,246,0.12)] backdrop-blur-xl">
      <h2 className="text-lg font-bold text-white">Open a real project</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Select a local folder and the visualizer will build modules, file imports, and function call graphs from your actual codebase.
      </p>
      <button
        onClick={onOpenProject}
        className="mt-5 rounded-lg border border-blue-400/25 bg-blue-500/15 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/25"
      >
        Open Project
      </button>
    </div>
  </div>
);
