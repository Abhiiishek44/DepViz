import type { CodeGraph } from "../types";
import type { ArchitectureStyle, CommunicationPattern, ExecutionModel, SystemOverview, TechnologySummary } from "./types";

const inferArchitectureStyle = (technology: TechnologySummary): ArchitectureStyle => {
  if (technology.runtime.includes("Electron")) return "Desktop Application";
  if (technology.frontend.length > 0 && technology.backend.length > 0) return "Layered Monolith";
  if (technology.backend.length > 0) return "Modular Monolith";
  return "Library";
};

const inferExecutionModel = (technology: TechnologySummary): ExecutionModel => {
  if (technology.backend.length > 0) return "Request Response";
  return "Hybrid";
};

const inferCommunicationPattern = (graph: CodeGraph): CommunicationPattern => {
  const hasGraphQL = Array.from(graph.files.values()).some((file) =>
    file.imports.some((imp) => imp.includes("graphql"))
  );
  if (hasGraphQL) return "GraphQL";
  if (Array.from(graph.files.values()).some((file) => file.imports.some((imp) => imp.includes("express")))) {
    return "REST API";
  }
  return "Mixed";
};

export const analyzeSystemOverview = (graph: CodeGraph, technology: TechnologySummary): SystemOverview => {
  return {
    architectureStyle: inferArchitectureStyle(technology),
    primaryPurpose: "Application platform",
    executionModel: inferExecutionModel(technology),
    communicationPattern: inferCommunicationPattern(graph),
    runtime: technology.runtime[0] || "Node.js",
    frontend: technology.frontend[0] || "Unknown",
    backend: technology.backend[0] || "Unknown",
    database: technology.database[0] || "None",
  };
};
