import { EdgeMetadata, NodeMetadata } from "../../shared/protocol";

export type HashCache = Map<string, string>;

export type HashState = {
  nodeHashes: HashCache;
  edgeHashes: HashCache;
};

export const createHashState = (): HashState => ({
  nodeHashes: new Map(),
  edgeHashes: new Map()
});

const FNV_OFFSET = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;
const FNV_MASK = 0xffffffffffffffffn;

export const hashString = (value: string): string => {
  let hash = FNV_OFFSET;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= BigInt(value.charCodeAt(i));
    hash = (hash * FNV_PRIME) & FNV_MASK;
  }

  return hash.toString(16).padStart(16, "0");
};

const stableSerialize = (value: unknown): string => {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, entry]) => `${key}:${stableSerialize(entry)}`).join(",")}}`;
  }

  return JSON.stringify(value);
};

const normalizeArray = (values?: string[], shouldSort = true) => {
  const list = values ? [...values] : [];
  return shouldSort ? list.sort() : list;
};

export const createStableNodeSignature = (node: NodeMetadata): string => {
  const signature = {
    id: node.id,
    type: node.type,
    name: node.name,
    path: node.path ?? "",
    params: node.params ?? [],
    calls: normalizeArray(node.calls),
    functions: normalizeArray(node.functions),
    imports: normalizeArray(node.imports)
  };

  return stableSerialize(signature);
};

export const createStableEdgeSignature = (edge: EdgeMetadata): string => {
  const type = edge.type ?? "UNKNOWN";
  return `${type}|${edge.source}|${edge.target}`;
};

export const hashNode = (node: NodeMetadata, cache?: HashCache): string => {
  const signature = createStableNodeSignature(node);
  const hash = hashString(signature);
  cache?.set(node.id, hash);
  return hash;
};

export const hashEdge = (edge: EdgeMetadata, cache?: HashCache): string => {
  const signature = createStableEdgeSignature(edge);
  const hash = hashString(signature);
  cache?.set(edge.id, hash);
  return hash;
};
