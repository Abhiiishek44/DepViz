import type { CodeGraph } from "../types";
import { getBaseName, prettify, toSemanticId } from "./utils";

export type RouteDefinition = {
  name: string;
  path: string;
  method: string;
  controller?: string;
};

const normalizeMethod = (raw: string) => {
  const map: Record<string, string> = {
    get: "GET",
    list: "GET",
    find: "GET",
    post: "POST",
    create: "POST",
    put: "PUT",
    update: "PUT",
    patch: "PATCH",
    delete: "DELETE",
    remove: "DELETE",
    handle: "ALL",
  };
  return map[raw.toLowerCase()] || raw.toUpperCase();
};

const isRouteFile = (name: string) =>
  ["route", "router", "controller", "handler", "endpoint", "api"].some((k) => name.includes(k));

export const detectRoutes = (graph: CodeGraph, projectPath: string): RouteDefinition[] => {
  const routes: RouteDefinition[] = [];
  const seen = new Set<string>();

  for (const fn of graph.functions.values()) {
    const fnLower = fn.name.toLowerCase();
    const fileLower = getBaseName(fn.file).toLowerCase();

    if (isRouteFile(fileLower)) {
      const methodMatch = fnLower.match(/^(get|post|put|patch|delete|handle|create|update|remove|list|find)/);
      if (methodMatch) {
        const method = normalizeMethod(methodMatch[1]);
        const resource = fn.name.replace(methodMatch[0], "");
        const path = "/" + (resource || fn.name).replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");
        const key = `${method}:${path}`;
        if (seen.has(key)) continue;
        seen.add(key);
        routes.push({
          name: prettify(fn.name),
          path,
          method,
          controller: toSemanticId(fn.file, projectPath)
        });
      }
    }
  }

  for (const file of graph.files.values()) {
    const filePath = file.path || file.id;
    const normalized = filePath.replace(projectPath, "");
    const base = getBaseName(filePath).toLowerCase();
    if (base === "route" || base === "page") {
      const segments = normalized.split("/").filter((s) => s && s !== "src" && s !== "app" && !s.startsWith("("));
      segments.pop();
      const routePath = "/" + segments.join("/") || "/";
      const key = `FSR:${routePath}`;
      if (seen.has(key)) continue;
      seen.add(key);
      routes.push({
        name: prettify(routePath.replace("/", "")) || "Route",
        path: routePath,
        method: base === "route" ? "ALL" : "GET",
        controller: toSemanticId(filePath, projectPath)
      });
    }
  }

  return routes;
};
