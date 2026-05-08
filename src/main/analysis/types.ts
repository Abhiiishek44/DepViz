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

export type CodeGraph = {
  functions: Map<string, FunctionNode>;
  files: Map<string, FileNode>;
};
