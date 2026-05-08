import { EdgeMetadata, GraphPatch, NodeMetadata } from "../../shared/protocol";
import { CodeGraph, FileNode, FunctionNode } from "./types";

export function computeGraphPatch(oldGraph: CodeGraph, newGraph: CodeGraph): GraphPatch {
  const patch: GraphPatch = {
    addedNodes: [],
    updatedNodes: [],
    removedNodes: [],
    addedEdges: [],
    removedEdges: []
  };

  diffNodes(oldGraph.files, newGraph.files, patch, fileToNode);
  diffNodes(oldGraph.functions, newGraph.functions, patch, fnToNode);

  return patch;
}

function diffNodes<T extends FileNode | FunctionNode>(
  oldNodes: Map<string, T>,
  newNodes: Map<string, T>,
  patch: GraphPatch,
  toMetadata: (node: T) => NodeMetadata
) {
  for (const [id, newNode] of newNodes.entries()) {
    const oldNode = oldNodes.get(id);
    if (!oldNode) {
      patch.addedNodes.push(toMetadata(newNode));
    } else if (JSON.stringify(oldNode) !== JSON.stringify(newNode)) {
      patch.updatedNodes.push(toMetadata(newNode));
    }
  }

  for (const id of oldNodes.keys()) {
    if (!newNodes.has(id)) {
      patch.removedNodes.push(id);
    }
  }
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

export function createEdgeId(source: string, target: string, type = "call") {
  return `${type}:${source}->${target}`;
}

export function toEdgeMetadata(source: string, target: string, type = "call"): EdgeMetadata {
  return {
    id: createEdgeId(source, target, type),
    source,
    target,
    type
  };
}
