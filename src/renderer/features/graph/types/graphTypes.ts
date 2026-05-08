import { Node } from "reactflow";

export type FunctionNode = {
  id: string;
  name: string;
  file: string;
  params: string[];
  calls: string[];
};

export type FileNode = {
  id: string;
  path: string;
  functions: string[];
  imports: string[];
};

export type FolderNode = {
  id: string;
  name: string;
  fullPath: string;
  parentFolderId?: string;
  childFolders: string[];
  files: string[];
};

export type CodeGraph = {
  functions: Record<string, FunctionNode>;
  files: Record<string, FileNode>;
};

export type DrillState = {
  expandedFolders: Set<string>;
  expandedFiles: Set<string>;
  expandedFunctions: Set<string>;
  expandedIncoming: Set<string>;
};

export type NodeKind = "folder" | "file" | "function";

export type GraphNode = Node<any> & { type: NodeKind };

export type BreadcrumbItem = {
  id: string;
  label: string;
  type: NodeKind;
};
