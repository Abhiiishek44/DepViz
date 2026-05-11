import {
  EdgeMetadata,
  GraphEdgeType,
  GraphPatch,
  GraphSnapshot,
  NodeMetadata
} from "../../shared/protocol";
import { diffEdges } from "./diffEdges";
import { diffNodes } from "./diffNodes";
import { GraphVersionManager } from "./graphVersionManager";
import { CodeGraph, FileNode, FunctionNode } from "./types";

type PatchOptions = {
  versionManager?: GraphVersionManager;
  baseVersion?: number;
  batchId?: string;
  transactionId?: string;
};

export function computeGraphPatch(
  oldGraph: CodeGraph,
  newGraph: CodeGraph,
  options: PatchOptions = {}
): GraphPatch {
  const versionManager = options.versionManager ?? new GraphVersionManager();
  const baseVersion = options.baseVersion ?? versionManager.getVersion();

  const oldNodes = buildNodeIndex(oldGraph);
  const newNodes = buildNodeIndex(newGraph);
  const oldEdges = buildEdgeIndex(oldGraph);
  const newEdges = buildEdgeIndex(newGraph);

  const nodeDiff = diffNodes(oldNodes, newNodes, {
    previousHashes: versionManager.getHashState().nodeHashes
  });
  const edgeDiff = diffEdges(oldEdges, newEdges, {
    previousHashes: versionManager.getHashState().edgeHashes
  });

  versionManager.updateHashes({
    nodeHashes: nodeDiff.nextHashes,
    edgeHashes: edgeDiff.nextHashes
  });

  return versionManager.createPatch(baseVersion, nodeDiff.delta, edgeDiff.delta, {
    batchId: options.batchId,
    transactionId: options.transactionId
  });
}

export function buildGraphSnapshot(
  graph: CodeGraph,
  versionManager: GraphVersionManager = new GraphVersionManager(),
  options: Omit<PatchOptions, "versionManager" | "baseVersion"> = {}
): GraphSnapshot {
  const nodes = Array.from(buildNodeIndex(graph).values());
  const edges = Array.from(buildEdgeIndex(graph).values());

  return versionManager.createSnapshot(nodes, edges, {
    batchId: options.batchId,
    transactionId: options.transactionId
  });
}

export function buildNodeIndex(graph: CodeGraph): Map<string, NodeMetadata> {
  const index = new Map<string, NodeMetadata>();

  for (const file of graph.files.values()) {
    index.set(file.id, fileToNode(file));
  }

  for (const fn of graph.functions.values()) {
    index.set(fn.id, fnToNode(fn));
  }

  return index;
}

export function buildEdgeIndex(graph: CodeGraph): Map<string, EdgeMetadata> {
  const edges = new Map<string, EdgeMetadata>();

  for (const file of graph.files.values()) {
    for (const importTarget of file.imports) {
      addEdge(edges, toEdgeMetadata(file.id, importTarget, "IMPORTS"));
    }

    for (const fnId of file.functions) {
      addEdge(edges, toEdgeMetadata(file.id, fnId, "DECLARES"));
    }
  }

  for (const fn of graph.functions.values()) {
    for (const callTarget of fn.calls) {
      addEdge(edges, toEdgeMetadata(fn.id, callTarget, "CALLS"));
    }
  }

  return edges;
}

function fileToNode(file: FileNode): NodeMetadata {
  return {
    id: file.id,
    name: file.path.split(/[\\/]/).pop() || file.path,
    type: "file",
    path: file.path,
    functions: file.functions,
    imports: file.imports
  };
}

function fnToNode(fn: FunctionNode): NodeMetadata {
  return {
    id: fn.id,
    name: fn.name,
    type: "function",
    path: fn.file,
    params: fn.params,
    calls: fn.calls
  };
}

export function createEdgeId(source: string, target: string, type: GraphEdgeType = "CALLS") {
  return `${type}:${source}->${target}`;
}

export function toEdgeMetadata(
  source: string,
  target: string,
  type: GraphEdgeType = "CALLS"
): EdgeMetadata {
  return {
    id: createEdgeId(source, target, type),
    source,
    target,
    type
  };
}

const addEdge = (edges: Map<string, EdgeMetadata>, edge: EdgeMetadata) => {
  if (!edges.has(edge.id)) {
    edges.set(edge.id, edge);
  }
};
