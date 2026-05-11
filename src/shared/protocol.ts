export type NodeId = string;
export type EdgeId = string;

export type GraphEdgeType =
  | "IMPORTS"
  | "CALLS"
  | "DEPENDS_ON"
  | "DECLARES"
  | "EXTENDS"
  | "IMPLEMENTS";

export interface NodeMetadata {
  id: NodeId;
  name: string;
  type: "file" | "function" | "folder";
  params?: string[];
  calls?: string[];
  files?: string[];
  functions?: string[];
  imports?: string[];
  path?: string;
}

export interface EdgeMetadata {
  id: EdgeId;
  source: NodeId;
  target: NodeId;
  type?: GraphEdgeType;
}

export type NodeDelta = {
  added: NodeMetadata[];
  updated: NodeMetadata[];
  removed: NodeId[];
};

export type EdgeDelta = {
  added: EdgeMetadata[];
  updated: EdgeMetadata[];
  removed: EdgeId[];
};

export interface GraphPatch {
  kind: "PATCH";
  baseVersion: number;
  version: number;
  timestamp: number;
  batchId?: string;
  transactionId?: string;
  nodes: NodeDelta;
  edges: EdgeDelta;
}

export interface GraphSnapshot {
  kind: "SNAPSHOT";
  version: number;
  timestamp: number;
  batchId?: string;
  transactionId?: string;
  nodes: NodeMetadata[];
  edges: EdgeMetadata[];
}

export type GraphSyncEvent =
  | { type: "SNAPSHOT"; timestamp: number; payload: GraphSnapshot }
  | { type: "PATCH"; timestamp: number; patch: GraphPatch };
