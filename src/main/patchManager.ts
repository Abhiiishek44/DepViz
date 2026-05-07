import { CodeGraph, FileNode, FunctionNode } from "./ir";
import { GraphPatch, NodeMetadata, EdgeMetadata } from "../shared/protocol";

export function computeGraphPatch(oldGraph: CodeGraph, newGraph: CodeGraph): GraphPatch {
  const patch: GraphPatch = {
    addedNodes: [],
    updatedNodes: [],
    removedNodes: [],
    addedEdges: [],
    removedEdges: []
  };

  // Convert FileNode to NodeMetadata
  const fileToNode = (file: FileNode): NodeMetadata => ({
    id: file.id,
    name: file.path.split(/[\\/]/).pop() || file.path,
    type: "file",
    path: file.path,
    functions: file.functions,
    imports: file.imports
  });

  // Convert FunctionNode to NodeMetadata
  const fnToNode = (fn: FunctionNode): NodeMetadata => ({
    id: fn.id,
    name: fn.name,
    type: "function",
    path: fn.file,
    params: fn.params,
    calls: fn.calls
  });

  // Diff Files
  for (const [id, newFile] of newGraph.files.entries()) {
    const oldFile = oldGraph.files.get(id);
    if (!oldFile) {
      patch.addedNodes.push(fileToNode(newFile));
    } else {
      // Basic check for update
      if (oldFile.functions.length !== newFile.functions.length || oldFile.imports.length !== newFile.imports.length) {
        patch.updatedNodes.push(fileToNode(newFile));
      }
    }
  }

  for (const id of oldGraph.files.keys()) {
    if (!newGraph.files.has(id)) {
      patch.removedNodes.push(id);
    }
  }

  // Diff Functions
  for (const [id, newFn] of newGraph.functions.entries()) {
    const oldFn = oldGraph.functions.get(id);
    if (!oldFn) {
      patch.addedNodes.push(fnToNode(newFn));
    } else {
      // Basic check for update
      if (oldFn.calls.length !== newFn.calls.length || oldFn.params.length !== newFn.params.length) {
        patch.updatedNodes.push(fnToNode(newFn));
      }
    }
  }

  for (const id of oldGraph.functions.keys()) {
    if (!newGraph.functions.has(id)) {
      patch.removedNodes.push(id);
    }
  }

  return patch;
}
