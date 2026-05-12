import type { CodeGraph } from "../types";
import type { EdgeLevel, ServiceKind } from "./types";

const SERVICE_KEYWORDS: Array<{ keyword: string; kind: ServiceKind }> = [
  { keyword: "ipc", kind: "ipc-handler" },
  { keyword: "handler", kind: "ipc-handler" },
  { keyword: "graph", kind: "graph-builder" },
  { keyword: "analyzer", kind: "analysis-engine" },
  { keyword: "analysis", kind: "analysis-engine" },
  { keyword: "visualizer", kind: "visualization-engine" },
  { keyword: "renderer", kind: "renderer-component" },
  { keyword: "component", kind: "component" },
  { keyword: "store", kind: "state-manager" },
  { keyword: "state", kind: "state-manager" },
  { keyword: "watch", kind: "runtime-orchestrator" },
  { keyword: "route", kind: "api-route" },
  { keyword: "page", kind: "page" },
  { keyword: "prisma", kind: "database" },
  { keyword: "mongoose", kind: "database" },
  { keyword: "auth", kind: "auth-provider" },
  { keyword: "jwt", kind: "auth-provider" },
  { keyword: "axios", kind: "external-api" },
  { keyword: "fetch", kind: "external-api" },
  { keyword: "controller", kind: "controller" },
  { keyword: "service", kind: "service" },
  { keyword: "repository", kind: "repository" },
  { keyword: "repo", kind: "repository" },
  { keyword: "middleware", kind: "middleware" },
  { keyword: "guard", kind: "middleware" },
  { keyword: "interceptor", kind: "middleware" },
  { keyword: "gateway", kind: "gateway" },
  { keyword: "adapter", kind: "adapter" },
  { keyword: "worker", kind: "worker" },
  { keyword: "queue", kind: "worker" },
  { keyword: "model", kind: "model" },
  { keyword: "schema", kind: "model" },
  { keyword: "entity", kind: "model" },
];

const DOMAIN_RULES: Array<{ keyword: string; domain: string; responsibility: string }> = [
  { keyword: "ipc", domain: "IPC Layer", responsibility: "Inter-process communication" },
  { keyword: "analysis", domain: "Analysis Engine", responsibility: "Code analysis and architecture extraction" },
  { keyword: "graph", domain: "Graph Engine", responsibility: "Graph computation and diffing" },
  { keyword: "persistence", domain: "Persistence Layer", responsibility: "Data persistence and storage" },
  { keyword: "renderer", domain: "Visualization Engine", responsibility: "User interface rendering" },
  { keyword: "visualizer", domain: "Visualization Engine", responsibility: "Graph visualization" },
  { keyword: "watch", domain: "Runtime Orchestration", responsibility: "File watching and runtime orchestration" },
  { keyword: "auth", domain: "Authentication", responsibility: "User authentication and authorization" },
  { keyword: "login", domain: "Authentication", responsibility: "User authentication and authorization" },
  { keyword: "user", domain: "User Management", responsibility: "User profile and account management" },
  { keyword: "profile", domain: "User Management", responsibility: "User profile management" },
  { keyword: "post", domain: "Content", responsibility: "Post and content management" },
  { keyword: "blog", domain: "Content", responsibility: "Post and content management" },
  { keyword: "comment", domain: "Content", responsibility: "Comment management" },
  { keyword: "payment", domain: "Payments", responsibility: "Billing and payment processing" },
  { keyword: "billing", domain: "Payments", responsibility: "Billing and payment processing" },
  { keyword: "order", domain: "Orders", responsibility: "Order lifecycle management" },
  { keyword: "cart", domain: "Commerce", responsibility: "Shopping cart management" },
  { keyword: "product", domain: "Catalog", responsibility: "Product catalog management" },
  { keyword: "inventory", domain: "Catalog", responsibility: "Inventory management" },
  { keyword: "upload", domain: "Media", responsibility: "File and media management" },
  { keyword: "media", domain: "Media", responsibility: "File and media management" },
  { keyword: "notification", domain: "Notifications", responsibility: "Notification delivery" },
  { keyword: "email", domain: "Notifications", responsibility: "Email delivery" },
  { keyword: "analytics", domain: "Analytics", responsibility: "Reporting and analytics" },
  { keyword: "report", domain: "Analytics", responsibility: "Reporting and analytics" },
  { keyword: "admin", domain: "Administration", responsibility: "Admin management" },
];

export const getBaseName = (filePath: string) =>
  (filePath.split("/").pop() || "").replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, "");

export const prettify = (name: string) =>
  name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_.]/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const inferServiceKind = (name: string): ServiceKind => {
  const lower = name.toLowerCase();
  for (const rule of SERVICE_KEYWORDS) {
    if (lower.includes(rule.keyword)) return rule.kind;
  }
  return "other";
};

export const inferLayer = (value: string) => {
  const lower = value.toLowerCase();
  if (lower.includes("renderer") || lower.includes("visual")) return "presentation";
  if (lower.includes("ipc") || lower.includes("handler")) return "orchestration";
  if (lower.includes("analysis") || lower.includes("extract")) return "analysis";
  if (lower.includes("graph")) return "graph-engine";
  if (lower.includes("persistence") || lower.includes("repository")) return "persistence";
  if (lower.includes("watch")) return "runtime";
  if (lower.includes("shared")) return "shared";
  return "infrastructure";
};

export const inferDomain = (value: string) => {
  const lower = value.toLowerCase();
  for (const rule of DOMAIN_RULES) {
    if (lower.includes(rule.keyword)) {
      return { name: rule.domain, responsibility: rule.responsibility };
    }
  }
  return { name: "Core", responsibility: "Core business logic" };
};

export const classifyEdgeLevel = (source: string, target: string): EdgeLevel => {
  const value = `${source} ${target}`.toLowerCase();
  const implementationHints = [
    "utils",
    "helper",
    "types",
    "constants",
    "graphhasher",
    "diff",
    "patch",
    "schema",
    "model",
  ];
  return implementationHints.some((hint) => value.includes(hint)) ? "implementation" : "architecture";
};

export const toSemanticId = (filePath: string, projectPath?: string) => {
  const relative = projectPath ? filePath.replace(projectPath, "").replace(/^\//, "") : filePath;
  return relative
    .replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, "")
    .replace(/[^a-zA-Z0-9/]+/g, "_")
    .replace(/\//g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
};

export const collectExternalImports = (graph: CodeGraph) => {
  const external = new Set<string>();
  for (const file of graph.files.values()) {
    for (const imp of file.imports) {
      if (!graph.files.has(imp) && !imp.startsWith(".") && !imp.startsWith("/")) {
        external.add(imp);
      }
    }
  }
  return external;
};

export const extractTokens = (value: string) =>
  value
    .replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, "")
    .replace(/[-_.]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/\s+|\//)
    .filter(Boolean);
