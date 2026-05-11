import { EdgeDelta, EdgeMetadata } from "../../shared/protocol";
import { HashCache, hashEdge } from "./graphHasher";

export type DiffEdgesResult = {
  delta: EdgeDelta;
  nextHashes: HashCache;
};

type DiffEdgesOptions = {
  previousHashes?: HashCache;
};

export const diffEdges = (
  oldEdges: Map<string, EdgeMetadata>,
  newEdges: Map<string, EdgeMetadata>,
  options: DiffEdgesOptions = {}
): DiffEdgesResult => {
  const delta: EdgeDelta = { added: [], updated: [], removed: [] };
  const nextHashes: HashCache = new Map();

  for (const [id, newEdge] of newEdges.entries()) {
    const oldEdge = oldEdges.get(id);
    const newHash = hashEdge(newEdge, nextHashes);

    if (!oldEdge) {
      delta.added.push(newEdge);
      continue;
    }

    const oldHash = options.previousHashes?.get(id) ?? hashEdge(oldEdge);
    if (oldHash !== newHash) {
      delta.updated.push(newEdge);
    }
  }

  for (const id of oldEdges.keys()) {
    if (!newEdges.has(id)) {
      delta.removed.push(id);
    }
  }

  return { delta, nextHashes };
};
