export type ArchitectureStyle =
  | "Layered Monolith"
  | "Modular Monolith"
  | "Service-Oriented"
  | "Microservices"
  | "Event-Driven"
  | "Desktop Application"
  | "Library";

export type ExecutionModel = "Request Response" | "Event Driven" | "Batch" | "Hybrid";

export type CommunicationPattern = "REST API" | "GraphQL" | "RPC" | "Event Bus" | "IPC" | "Mixed";

export type ServiceKind =
  | "ipc-handler"
  | "graph-builder"
  | "analysis-engine"
  | "renderer-component"
  | "state-manager"
  | "runtime-orchestrator"
  | "visualization-engine"
  | "api-route"
  | "page"
  | "component"
  | "database"
  | "auth-provider"
  | "external-api"
  | "controller"
  | "service"
  | "repository"
  | "middleware"
  | "gateway"
  | "worker"
  | "adapter"
  | "model"
  | "utility"
  | "other";

export type EdgeType = "calls" | "queries" | "middleware" | "publishes" | "depends" | "api_call";

export type EdgeLevel = "architecture" | "implementation";

export type Importance = "high" | "medium" | "low";

export interface SystemOverview {
  architectureStyle: ArchitectureStyle;
  primaryPurpose: string;
  executionModel: ExecutionModel;
  communicationPattern: CommunicationPattern;
  runtime: string;
  frontend: string;
  backend: string;
  database: string;
}

export interface Domain {
  name: string;
  responsibility: string;
  services: string[];
}

export interface RequestFlow {
  name: string;
  entry: string;
  steps: string[];
}

export interface ServiceNode {
  id: string;
  name: string;
  kind: ServiceKind;
  layer: string;
  filePath: string;
  domain?: string;
}

export interface ServiceEdge {
  from: string;
  to: string;
  type: EdgeType;
  level: EdgeLevel;
}

export interface ServiceGraph {
  nodes: ServiceNode[];
  edges: ServiceEdge[];
}

export interface RuntimeGraph {
  nodes: ServiceNode[];
  edges: ServiceEdge[];
}

export interface CriticalPath {
  name: string;
  importance: Importance;
  path: string[];
}

export interface EntryPoint {
  name: string;
  type: string;
  filePath: string;
}

export interface TechnologySummary {
  frontend: string[];
  backend: string[];
  database: string[];
  auth: string[];
  deployment: string[];
  runtime: string[];
}

export interface ArchitectureSummary {
  purpose: string;
  architecture: string;
  mainFlow: string;
  authentication: string;
  communication: string;
}

export interface DependencyIntelligence {
  internalEdges: ServiceEdge[];
  externalPackages: string[];
}

export interface ArchitectureJSON {
  system: SystemOverview;
  domains: Domain[];
  requestFlows: RequestFlow[];
  serviceGraph: ServiceGraph;
  runtimeGraph: RuntimeGraph;
  databaseAccessGraph: RuntimeGraph;
  criticalPaths: CriticalPath[];
  entrypoints: EntryPoint[];
  technology: TechnologySummary;
  summary: ArchitectureSummary;
  dependencyIntelligence: DependencyIntelligence;
  metadata: {
    projectName: string;
    projectPath: string;
    generatedAt: string;
    stats: {
      files: number;
      functions: number;
      services: number;
      domains: number;
      flows: number;
    };
  };
}
