export type NodeType = 'service' | 'database' | 'api' | 'external' | 'queue' | 'cache';
export type EdgeType = 'sync' | 'async' | 'event';
export type LayerType = 'presentation' | 'application' | 'domain' | 'infrastructure' | 'external';

export interface ArchitectureNode {
  id: string;
  type: NodeType;
  label: string;
  layer: LayerType;
  container?: string;
  description?: string;
  techStack?: string[];
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
  protocol?: string;
}

export interface ArchitectureContainer {
  id: string;
  label: string;
  type?: string;
}

import { ArchitectureJSON as ExtractedArchitectureJSON } from '../../analysis/architectureExtractor';

export type ArchitectureJSON = ExtractedArchitectureJSON;


// React Flow Types (Simplified for MVP)
export interface RFNode {
  id: string;
  type?: string;
  data: { label: string; layer: LayerType; description?: string; techStack?: string[] };
  position: { x: number; y: number };
  parentId?: string;
  extent?: 'parent';
}

export interface RFEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  type?: string;
}

export interface ReactFlowGraph {
  title: string;
  nodes: RFNode[];
  edges: RFEdge[];
}
