import dagre from "dagre";
import { VisualizerEdge, VisualizerNode } from "../types";

const nodeSize = (node: VisualizerNode) => {
  if (node.data.level === "architecture") return { width: 230, height: 96 };
  if (node.data.level === "files") return { width: 220, height: 86 };
  return { width: 230, height: 74 };
};

export const applyDagreLayout = (nodes: VisualizerNode[], edges: VisualizerEdge[]) => {
  const graph = new dagre.graphlib.Graph();
  const scale = Math.min(Math.max(nodes.length, 4), 14);
  const level = nodes[0]?.data.level;
  const isFileLevel = level === "files";
  const isFunctionLevel = level === "functions";

  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "LR",
    acyclicer: "greedy",
    ranker: "network-simplex",
    nodesep: isFileLevel ? 118 : isFunctionLevel ? 86 : 74 + scale * 3,
    ranksep: isFileLevel ? 250 : isFunctionLevel ? 190 : 150 + scale * 6,
    edgesep: isFileLevel ? 78 : 44,
    marginx: 72,
    marginy: 72
  });

  nodes.forEach((node) => {
    graph.setNode(node.id, nodeSize(node));
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target, {
      minlen: isFileLevel ? 2 : 1,
      weight: edge.id.includes("auth.module") || edge.id.includes("controller") ? 2 : 1
    });
  });

  dagre.layout(graph);

  return nodes.map((node) => {
    const measured = graph.node(node.id);
    const size = nodeSize(node);

    return {
      ...node,
      position: {
        x: measured.x - size.width / 2,
        y: measured.y - size.height / 2
      }
    };
  });
};
