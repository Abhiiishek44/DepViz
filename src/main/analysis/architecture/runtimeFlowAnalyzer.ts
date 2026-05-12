import type { RuntimeGraph, ServiceGraph, ServiceEdge, ServiceNode } from "./types";

const collectNodes = (serviceGraph: ServiceGraph, edges: ServiceEdge[]): ServiceNode[] => {
  const ids = new Set<string>();
  edges.forEach((edge) => {
    ids.add(edge.from);
    ids.add(edge.to);
  });
  return serviceGraph.nodes.filter((node) => ids.has(node.id));
};

export const buildRuntimeGraph = (serviceGraph: ServiceGraph): RuntimeGraph => {
  const edges = serviceGraph.edges.filter((edge) => edge.type !== "depends");
  return {
    nodes: collectNodes(serviceGraph, edges),
    edges,
  };
};

export const buildDatabaseAccessGraph = (serviceGraph: ServiceGraph): RuntimeGraph => {
  const edges = serviceGraph.edges.filter((edge) => edge.type === "queries");
  return {
    nodes: collectNodes(serviceGraph, edges),
    edges,
  };
};

export const extractExecutionEdges = (serviceGraph: ServiceGraph): ServiceEdge[] =>
  serviceGraph.edges.filter((edge) => edge.type === "calls" || edge.type === "middleware");
