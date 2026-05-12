import type { CodeGraph } from "../types";
import type { DependencyIntelligence, ServiceEdge } from "./types";
import { classifyEdgeLevel, collectExternalImports, inferServiceKind, toSemanticId } from "./utils";

export const analyzeDependencies = (graph: CodeGraph, projectPath: string): DependencyIntelligence => {
  const externalPackages = Array.from(collectExternalImports(graph)).sort();
  const internalEdges: ServiceEdge[] = [];
  const edgeKeys = new Set<string>();

  for (const fn of graph.functions.values()) {
  const sourceName = toSemanticId(fn.file, projectPath);
    for (const callTarget of fn.calls) {
      const target = graph.functions.get(callTarget);
      if (!target) continue;

  const targetName = toSemanticId(target.file, projectPath);
      if (sourceName === targetName) continue;

      const targetKind = inferServiceKind(targetName);
      const type = targetKind === "repository" || targetKind === "model" ? "queries" : "calls";
      const level = classifyEdgeLevel(sourceName, targetName);
      const key = `${sourceName}:${targetName}:${type}:${level}`;
      if (edgeKeys.has(key)) continue;

      edgeKeys.add(key);
      internalEdges.push({
        from: sourceName,
        to: targetName,
        type,
        level,
      });
    }
  }

  return { internalEdges, externalPackages };
};
