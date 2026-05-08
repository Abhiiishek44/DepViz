import { CodeGraph as ProjectCodeGraph } from "../../graph/types/graphTypes";
import { FileNode, FunctionNode, ModuleNode, RealProjectModel } from "../types";

const MODULE_COLORS = ["#60a5fa", "#a855f7", "#4ade80", "#fb923c", "#22d3ee", "#facc15", "#f472b6", "#38bdf8"];

export const createProjectModel = (graph: ProjectCodeGraph, projectName: string): RealProjectModel => {
  const files = Object.values(graph.files);
  const normalizedPaths = files.map((file) => normalizePath(file.path));
  const rootSegments = getCommonRootSegments(normalizedPaths);
  const moduleByFile = new Map<string, string>();
  const modules = new Map<string, ModuleNode>();

  files.forEach((file) => {
    const relativePath = getRelativePath(file.path, rootSegments);
    const modulePath = getModulePath(relativePath);
    const moduleId = `module:${modulePath}`;
    moduleByFile.set(file.id, moduleId);

    if (!modules.has(moduleId)) {
      const index = modules.size;
      modules.set(moduleId, {
        id: moduleId,
        name: getModuleName(modulePath),
        subtitle: modulePath,
        kind: inferModuleKind(modulePath),
        owner: projectName || "Local project",
        status: "Healthy",
        files: [],
        dependencies: [],
        accent: MODULE_COLORS[index % MODULE_COLORS.length],
        path: modulePath
      });
    }

    modules.get(moduleId)!.files.push(file.id);
  });

  files.forEach((file) => {
    const sourceModuleId = moduleByFile.get(file.id);
    if (!sourceModuleId) return;

    const sourceModule = modules.get(sourceModuleId);
    file.imports.forEach((importId) => {
      const targetModuleId = moduleByFile.get(importId);
      if (targetModuleId && targetModuleId !== sourceModuleId && !sourceModule?.dependencies.includes(targetModuleId)) {
        sourceModule?.dependencies.push(targetModuleId);
      }
    });
  });

  const modelFiles = files.map((file): FileNode => {
    const moduleId = moduleByFile.get(file.id) || "module:root";
    const relativePath = getRelativePath(file.path, rootSegments);
    return {
      id: file.id,
      moduleId,
      name: getFileName(file.path),
      path: relativePath,
      type: inferFileType(file.path),
      imports: file.imports.filter((importId) => graph.files[importId]),
      exports: [],
      functions: file.functions,
      modified: "Live scan"
    };
  });

  const incomingCalls = new Map<string, string[]>();
  Object.values(graph.functions).forEach((fn) => {
    fn.calls.forEach((targetId) => {
      const callers = incomingCalls.get(targetId) || [];
      callers.push(fn.id);
      incomingCalls.set(targetId, callers);
    });
  });

  const modelFunctions = Object.values(graph.functions).map((fn): FunctionNode => ({
    id: fn.id,
    fileId: fn.file,
    name: fn.name || "anonymous",
    signature: `${fn.name || "anonymous"}(${fn.params.join(", ")})`,
    type: "Function Declaration",
    lines: "Detected by AST",
    calls: fn.calls,
    calledBy: incomingCalls.get(fn.id) || [],
    dependencies: fn.calls.map((callId) => graph.functions[callId]?.name || callId)
  }));

  return {
    projectName,
    graph,
    modules: Array.from(modules.values()).sort((a, b) => a.name.localeCompare(b.name)),
    files: modelFiles,
    functions: modelFunctions
  };
};

export const normalizePath = (path: string) => path.replace(/\\/g, "/");

export const getFileName = (path: string) => normalizePath(path).split("/").pop() || path;

export const getCommonRootSegments = (paths: string[]) => {
  if (paths.length === 0) return [] as string[];

  const segments = paths.map((path) => path.split("/").filter(Boolean));
  const minLength = Math.min(...segments.map((item) => item.length));
  const root: string[] = [];

  for (let index = 0; index < minLength; index += 1) {
    const segment = segments[0][index];
    if (segments.every((item) => item[index] === segment)) {
      root.push(segment);
    } else {
      break;
    }
  }

  return root;
};

const getRelativePath = (path: string, rootSegments: string[]) => {
  const segments = normalizePath(path).split("/").filter(Boolean);
  const relative = segments.slice(rootSegments.length).join("/");
  return relative || getFileName(path);
};

const getModulePath = (relativePath: string) => {
  const segments = relativePath.split("/").filter(Boolean);
  if (segments.length <= 1) return "(root)";

  if (segments[0] === "src" && segments[1]) {
    return segments.length > 2 ? `src/${segments[1]}` : "src";
  }

  if (["app", "pages", "components", "features", "lib", "main", "renderer"].includes(segments[0]) && segments[1]) {
    return `${segments[0]}/${segments[1]}`;
  }

  return segments[0];
};

const getModuleName = (modulePath: string) => {
  if (modulePath === "(root)") return "Root";
  return modulePath
    .split("/")
    .at(-1)!
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const inferModuleKind = (modulePath: string): ModuleNode["kind"] => {
  const lower = modulePath.toLowerCase();
  if (lower.includes("renderer") || lower.includes("frontend") || lower.includes("ui")) return "client";
  if (lower.includes("api") || lower.includes("server") || lower.includes("main")) return "gateway";
  if (lower.includes("db") || lower.includes("database") || lower.includes("schema")) return "database";
  return "service";
};

const inferFileType = (path: string): FileNode["type"] => {
  const lower = path.toLowerCase();
  if (lower.includes("controller")) return "controller";
  if (lower.includes("middleware")) return "middleware";
  if (lower.includes("util") || lower.includes("helper")) return "util";
  if (lower.includes("module") || lower.includes("index")) return "module";
  if (lower.includes("schema") || lower.includes("model")) return "schema";
  return "service";
};
