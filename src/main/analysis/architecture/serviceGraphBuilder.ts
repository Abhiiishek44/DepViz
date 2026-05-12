import type { CodeGraph } from "../types";
import type { ServiceEdge, ServiceGraph, ServiceNode, ServiceKind, EdgeType } from "./types";
import { getBaseName, inferLayer, inferServiceKind, prettify, toSemanticId, classifyEdgeLevel } from "./utils";

const DATABASE_PACKAGES = ["@prisma/client", "prisma", "mongoose", "mongodb", "pg", "mysql", "mysql2", "sqlite3", "better-sqlite3"];
const AUTH_PACKAGES = ["next-auth", "jsonwebtoken", "passport", "passport-jwt", "@auth0/auth0-react"];
const EXTERNAL_API_PACKAGES = ["axios", "node-fetch", "got", "superagent", "ky", "fetch"];

const SERVICE_HINTS = [
  "controller",
  "service",
  "repository",
  "repo",
  "middleware",
  "guard",
  "interceptor",
  "handler",
  "gateway",
  "adapter",
  "worker",
  "model",
  "schema",
  "entity",
  "route",
  "router",
  "page",
  "component",
];

const isServiceFile = (baseName: string) => {
  const lower = baseName.toLowerCase();
  return SERVICE_HINTS.some((hint) => lower.includes(hint));
};

const edgeTypeFromKinds = (targetKind: ServiceKind): EdgeType => {
  if (targetKind === "repository" || targetKind === "model") return "queries";
  if (targetKind === "middleware") return "middleware";
  return "calls";
};

export const buildServiceGraph = (graph: CodeGraph, projectPath: string): ServiceGraph => {
  const nodes: ServiceNode[] = [];
  const nodeByFile = new Map<string, ServiceNode>();
  const nodeById = new Map<string, ServiceNode>();
  const edges: ServiceEdge[] = [];
  const edgeKeys = new Set<string>();

  for (const file of graph.files.values()) {
    const filePath = file.path || file.id;
    const baseName = getBaseName(filePath);
    if (!isServiceFile(baseName)) continue;

    const kind = inferServiceKind(`${baseName} ${filePath}`);
    const name = prettify(baseName);
    const id = toSemanticId(filePath, projectPath);
    const node: ServiceNode = {
      id,
      name,
      kind,
      layer: inferLayer(filePath),
      filePath: filePath.replace(projectPath, "").replace(/^\//, ""),
    };

    nodes.push(node);
    nodeByFile.set(file.id, node);
    nodeById.set(node.id, node);
  }

  const ensureExternalNode = (id: string, name: string, kind: ServiceKind, layer: string) => {
    if (nodeById.has(id)) return nodeById.get(id)!;
    const node: ServiceNode = {
      id,
      name,
      kind,
      layer,
      filePath: "",
    };
    nodes.push(node);
    nodeById.set(id, node);
    return node;
  };

  for (const fn of graph.functions.values()) {
    const sourceNode = nodeByFile.get(fn.file);
    if (!sourceNode) continue;

    for (const callTarget of fn.calls) {
      const targetFn = graph.functions.get(callTarget);
      if (!targetFn) continue;

      const targetNode = nodeByFile.get(targetFn.file);
      if (!targetNode || targetNode.name === sourceNode.name) continue;

      const type = edgeTypeFromKinds(targetNode.kind);
      const level = classifyEdgeLevel(sourceNode.id, targetNode.id);
      const key = `${sourceNode.id}:${targetNode.id}:${type}:${level}`;
      if (edgeKeys.has(key)) continue;

      edgeKeys.add(key);
      edges.push({ from: sourceNode.id, to: targetNode.id, type, level });
    }
  }

  for (const file of graph.files.values()) {
    const sourceNode = nodeByFile.get(file.id);
    if (!sourceNode) continue;

    for (const imp of file.imports) {
      const targetNode = nodeByFile.get(imp);
      if (!targetNode || targetNode.name === sourceNode.name) continue;

      const level = classifyEdgeLevel(sourceNode.id, targetNode.id);
      const key = `${sourceNode.id}:${targetNode.id}:depends:${level}`;
      if (edgeKeys.has(key)) continue;

      edgeKeys.add(key);
      edges.push({ from: sourceNode.id, to: targetNode.id, type: "depends", level });
    }

    for (const imp of file.imports) {
      const pkg = imp.startsWith("@") ? imp.split("/").slice(0, 2).join("/") : imp.split("/")[0];

      if (DATABASE_PACKAGES.includes(pkg)) {
        const dbNode = ensureExternalNode(`database_${pkg.replace(/[^a-zA-Z0-9]+/g, "_")}`,
          pkg,
          "database",
          "persistence"
        );
        const key = `${sourceNode.id}:${dbNode.id}:queries:architecture`;
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push({ from: sourceNode.id, to: dbNode.id, type: "queries", level: "architecture" });
        }
      }

      if (AUTH_PACKAGES.includes(pkg)) {
        const authNode = ensureExternalNode(`auth_${pkg.replace(/[^a-zA-Z0-9]+/g, "_")}`,
          pkg,
          "auth-provider",
          "infrastructure"
        );
        const key = `${sourceNode.id}:${authNode.id}:calls:architecture`;
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push({ from: sourceNode.id, to: authNode.id, type: "calls", level: "architecture" });
        }
      }

      if (EXTERNAL_API_PACKAGES.includes(pkg)) {
        const apiNode = ensureExternalNode(`external_${pkg.replace(/[^a-zA-Z0-9]+/g, "_")}`,
          pkg,
          "external-api",
          "infrastructure"
        );
        const key = `${sourceNode.id}:${apiNode.id}:api_call:architecture`;
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push({ from: sourceNode.id, to: apiNode.id, type: "api_call", level: "architecture" });
        }
      }
    }
  }

  return { nodes, edges };
};
