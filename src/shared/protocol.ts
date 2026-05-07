export type NodeId = string;
export type EdgeId = string;

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
  type?: string;
}

export interface GraphPatch {
  addedNodes: NodeMetadata[];
  updatedNodes: NodeMetadata[];
  removedNodes: NodeId[];
  
  addedEdges: EdgeMetadata[];
  removedEdges: EdgeId[];
}

export type GraphSyncEvent = 
  | { type: 'SNAPSHOT'; timestamp: number; payload: any }
  | { type: 'PATCH'; timestamp: number; patch: GraphPatch };
