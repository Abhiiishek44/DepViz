import { Edge, MarkerType } from "reactflow";
import { FileNode, FunctionNode, ModuleNode, RealProjectModel, ViewState, VisualizerEdge, VisualizerNode } from "../types";
import { applyDagreLayout } from "./dagreLayout";

const baseEdge = (edge: VisualizerEdge): VisualizerEdge => ({
  type: "animatedDependency",
  animated: true,
  markerEnd: { type: MarkerType.ArrowClosed, color: edge.data?.accent || "#7dd3fc" },
  ...edge
});

export const buildGraphForView = (
  model: RealProjectModel | null,
  view: ViewState,
  search: string,
  hoveredEdgeId: string | null
) => {
  if (!model) {
    return { nodes: [], edges: [] };
  }

  const normalizedSearch = search.trim().toLowerCase();
  const nodes = getNodesForView(model, view);
  const visibleNodes = normalizedSearch
    ? nodes.filter((node) => `${node.data.title} ${node.data.subtitle}`.toLowerCase().includes(normalizedSearch))
    : nodes;

  const nodeIds = new Set(visibleNodes.map((node) => node.id));
  const edges = getEdgesForView(model, view)
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge) => ({
      ...edge,
      className: edge.id === hoveredEdgeId ? "dependency-edge dependency-edge-active" : "dependency-edge",
      style: {
        stroke: edge.id === hoveredEdgeId ? edge.data?.accent || "#a78bfa" : "rgba(148, 163, 184, 0.58)",
        strokeWidth: edge.id === hoveredEdgeId ? 2.4 : 1.4
      },
      data: {
        ...edge.data,
        showLabel: edge.id === hoveredEdgeId
      }
    }));

  return {
    nodes: applyDagreLayout(visibleNodes, edges),
    edges
  };
};

const getNodesForView = (model: RealProjectModel, view: ViewState): VisualizerNode[] => {
  if (view.level === "architecture") {
    return model.modules.map(moduleToNode);
  }

  if (view.level === "files" && view.moduleId) {
    const module = findModule(model, view.moduleId);
    if (!module) return [];
    return model.files
      .filter((file) => file.moduleId === module.id)
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((file) => fileToNode(file, module));
  }

  if (view.level === "functions" && view.fileId) {
    const file = findFile(model, view.fileId);
    return model.functions
      .filter((fn) => fn.fileId === file.id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((fn) => functionToNode(fn, file));
  }

  return [];
};

const getEdgesForView = (model: RealProjectModel, view: ViewState): VisualizerEdge[] => {
  if (view.level === "architecture") {
    return model.modules.flatMap((module) =>
      module.dependencies.map((targetId) =>
        baseEdge({
          id: `module:${module.id}->${targetId}`,
          source: module.id,
          target: targetId,
          label: "imports",
          data: { label: "imports", accent: module.accent }
        })
      )
    );
  }

  if (view.level === "files" && view.moduleId) {
    const module = findModule(model, view.moduleId);
    if (!module) return [];
    const fileIds = new Set(model.files.filter((file) => file.moduleId === module.id).map((file) => file.id));

    return model.files
      .filter((file) => file.moduleId === module.id)
      .flatMap((file) =>
        file.imports
          .filter((targetId) => fileIds.has(targetId))
          .map((targetId) =>
            baseEdge({
              id: `file:${file.id}->${targetId}`,
              source: file.id,
              target: targetId,
              label: "imports",
              data: { label: "imports", accent: module.accent }
            })
          )
      );
  }

  if (view.level === "functions" && view.fileId) {
    const file = findFile(model, view.fileId);
    const functionIds = new Set(model.functions.filter((fn) => fn.fileId === file.id).map((fn) => fn.id));

    return model.functions
      .filter((fn) => fn.fileId === file.id)
      .flatMap((fn) =>
        fn.calls
          .filter((targetId) => functionIds.has(targetId))
          .map((targetId) =>
            baseEdge({
              id: `function:${fn.id}->${targetId}`,
              source: fn.id,
              target: targetId,
              label: "calls",
              data: { label: "calls", accent: "#a78bfa" }
            })
          )
      );
  }

  return [];
};

const moduleToNode = (module: ModuleNode): VisualizerNode => ({
  id: module.id,
  type: "dependencyNode",
  position: { x: 0, y: 0 },
  data: {
    level: "architecture",
    title: module.name,
    subtitle: module.subtitle,
    badge: module.kind,
    kind: module.kind,
    accent: module.accent,
    meta: {
      Owner: module.owner,
      Status: module.status,
      Files: module.files.length,
      Dependencies: module.dependencies.length
    }
  }
});

const fileToNode = (file: FileNode, module: ModuleNode): VisualizerNode => ({
  id: file.id,
  type: "dependencyNode",
  position: { x: 0, y: 0 },
  data: {
    level: "files",
    title: file.name,
    subtitle: file.path,
    badge: file.type,
    kind: file.type,
    accent: module.accent,
    meta: {
      Path: file.path,
      Imports: file.imports.length,
      Exports: file.exports.length,
      Functions: file.functions.length,
      Modified: file.modified
    }
  }
});

const functionToNode = (fn: FunctionNode, file: FileNode): VisualizerNode => ({
  id: fn.id,
  type: "dependencyNode",
  position: { x: 0, y: 0 },
  data: {
    level: "functions",
    title: `${fn.name}()`,
    subtitle: fn.signature,
    badge: fn.type,
    kind: fn.type,
    accent: "#a78bfa",
    meta: {
      Type: fn.type,
      Lines: fn.lines,
      Calls: fn.calls.length,
      "Called by": fn.calledBy.length,
      File: file.name
    }
  }
});

export const findModule = (model: RealProjectModel | null, id: string) =>
  model?.modules.find((module) => module.id === id) || model?.modules[0] || null;

export const findFile = (model: RealProjectModel | null, id: string) =>
  model?.files.find((file) => file.id === id) || model?.files[0] || {
    id,
    moduleId: "module:root",
    name: id.split(/[\\/]/).pop() || id,
    path: id,
    type: "service",
    imports: [],
    exports: [],
    functions: [],
    modified: "Live scan"
  } satisfies FileNode;

export const findFunction = (model: RealProjectModel | null, id: string) =>
  model?.functions.find((fn) => fn.id === id) || null;

export const getInspectableEntity = (model: RealProjectModel | null, nodeId: string | null) => {
  if (!model || !nodeId) return null;

  return (
    model.modules.find((module) => module.id === nodeId) ||
    model.files.find((file) => file.id === nodeId) ||
    model.functions.find((fn) => fn.id === nodeId) ||
    null
  );
};

export const getLevelDescription = (view: ViewState) => {
  if (view.level === "architecture") return "Real modules inferred from your project folders and their import relationships";
  if (view.level === "files") return "Real files inside the selected module and their local imports";
  return "Real functions/classes detected in the selected file and their call relationships";
};

export const getGraphTitle = (model: RealProjectModel | null, view: ViewState) => {
  if (!model) return "Open a real project";
  if (view.level === "architecture") return model.projectName || "Architecture";

  if (view.level === "files" && view.moduleId) {
    return `Files in ${findModule(model, view.moduleId)?.name || "module"}`;
  }

  if (view.level === "functions" && view.fileId) {
    return `Functions in ${findFile(model, view.fileId).name}`;
  }

  return "Dependency Graph";
};

export type BuiltGraph = {
  nodes: VisualizerNode[];
  edges: Edge[];
};
