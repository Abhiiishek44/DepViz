import type { CodeGraph } from "./types";
import type { ArchitectureJSON } from "./architecture/types";
import { analyzeDependencies } from "./architecture/dependencyAnalyzer";
import { analyzeDomains } from "./architecture/domainAnalyzer";
import { analyzeEntrypoints } from "./architecture/entrypointAnalyzer";
import { detectRoutes } from "./architecture/routeDetector";
import { buildRuntimeGraph, buildDatabaseAccessGraph } from "./architecture/runtimeFlowAnalyzer";
import { analyzeRequestLifecycles } from "./architecture/requestLifecycleAnalyzer";
import { buildServiceGraph } from "./architecture/serviceGraphBuilder";
import { analyzeTechnology } from "./architecture/technologyAnalyzer";
import { analyzeSystemOverview } from "./architecture/systemOverviewAnalyzer";
import { analyzeCriticalPaths } from "./architecture/criticalPathAnalyzer";
import { summarizeArchitecture } from "./architecture/architectureSummarizer";

export type { ArchitectureJSON } from "./architecture/types";

export class ArchitectureExtractor {
  constructor(
    private graph: CodeGraph,
    private projectPath: string
  ) {}

  public extract(): ArchitectureJSON {
  const serviceGraph = buildServiceGraph(this.graph, this.projectPath);
    const routes = detectRoutes(this.graph, this.projectPath);
    const domains = analyzeDomains(serviceGraph);
    const requestFlows = analyzeRequestLifecycles(routes, serviceGraph);
    const runtimeGraph = buildRuntimeGraph(serviceGraph);
    const databaseAccessGraph = buildDatabaseAccessGraph(serviceGraph);
  const dependencyIntelligence = analyzeDependencies(this.graph, this.projectPath);
  const technology = analyzeTechnology(this.graph, this.projectPath);
  const system = analyzeSystemOverview(this.graph, technology);
    const entrypoints = analyzeEntrypoints(this.graph);
    const criticalPaths = analyzeCriticalPaths(requestFlows);
    const summary = summarizeArchitecture(system, technology, domains, requestFlows);

    return {
      system,
      domains,
      requestFlows,
      serviceGraph,
      runtimeGraph,
      databaseAccessGraph,
      criticalPaths,
      entrypoints,
      technology,
      summary,
      dependencyIntelligence,
      metadata: {
        projectName: this.projectPath.split(/[/\\]/).pop() || "unknown",
        projectPath: this.projectPath,
        generatedAt: new Date().toISOString(),
        stats: {
          files: this.graph.files.size,
          functions: this.graph.functions.size,
          services: serviceGraph.nodes.length,
          domains: domains.length,
          flows: requestFlows.length,
        },
      },
    };
  }
}
