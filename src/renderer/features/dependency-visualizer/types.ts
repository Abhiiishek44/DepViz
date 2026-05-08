import { Edge, Node, Viewport } from "reactflow";
import { CodeGraph as ProjectCodeGraph } from "../graph/types/graphTypes";

export type VisualizerLevel = "architecture" | "files" | "functions";
export type ServiceKind = "client" | "gateway" | "service" | "database";

export type ModuleNode = {
  id: string;
  name: string;
  subtitle: string;
  kind: ServiceKind;
  owner: string;
  status: "Healthy" | "Review" | "Busy";
  files: string[];
  dependencies: string[];
  accent: string;
  path: string;
};

export type FileNode = {
  id: string;
  moduleId: string;
  name: string;
  path: string;
  type: "controller" | "service" | "middleware" | "util" | "module" | "schema";
  imports: string[];
  exports: string[];
  functions: string[];
  modified: string;
};

export type FunctionNode = {
  id: string;
  fileId: string;
  name: string;
  signature: string;
  type: "Function Declaration" | "Class Method" | "Arrow Function";
  lines: string;
  calls: string[];
  calledBy: string[];
  dependencies: string[];
};

export type RealProjectModel = {
  projectName: string;
  graph: ProjectCodeGraph;
  modules: ModuleNode[];
  files: FileNode[];
  functions: FunctionNode[];
};

export type DependencyData = {
  modules: ModuleNode[];
  files: FileNode[];
  functions: FunctionNode[];
};

export type VisualizerNodeData = {
  level: VisualizerLevel;
  title: string;
  subtitle: string;
  badge?: string;
  kind?: ServiceKind | FileNode["type"] | FunctionNode["type"];
  accent: string;
  meta: Record<string, string | number>;
};

export type VisualizerNode = Node<VisualizerNodeData>;
export type VisualizerEdge = Edge<{ label?: string; accent?: string; showLabel?: boolean }>;

export type ViewState = {
  level: VisualizerLevel;
  moduleId?: string;
  fileId?: string;
};

export type BreadcrumbEntry = ViewState & {
  label: string;
};

export type ViewportByKey = Record<string, Viewport>;
