import { NodeDelta, NodeMetadata } from "../../shared/protocol";
import { HashCache, hashNode } from "./graphHasher";

export type DiffNodesResult = {
  delta: NodeDelta;
  nextHashes: HashCache;
};

type DiffNodesOptions = {
  previousHashes?: HashCache;
};

export const diffNodes = (
  oldNodes: Map<string, NodeMetadata>,
  newNodes: Map<string, NodeMetadata>,
  options: DiffNodesOptions = {}
): DiffNodesResult => {
  const delta: NodeDelta = { added: [], updated: [], removed: [] };
  const nextHashes: HashCache = new Map();

  for (const [id, newNode] of newNodes.entries()) {
    const oldNode = oldNodes.get(id);
    const newHash = hashNode(newNode, nextHashes);

    if (!oldNode) {
      delta.added.push(newNode);
      continue;
    }

    const oldHash = options.previousHashes?.get(id) ?? hashNode(oldNode);
    if (oldHash !== newHash) {
      delta.updated.push(newNode);
    }
  }

  for (const id of oldNodes.keys()) {
    if (!newNodes.has(id)) {
      delta.removed.push(id);
    }
  }

  return { delta, nextHashes };
};
