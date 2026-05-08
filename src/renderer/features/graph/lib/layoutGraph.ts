import { Edge } from "reactflow";
import dagre from "dagre";
import { GraphNode } from "../types/graphTypes";

export const layoutGraph = (nodes: GraphNode[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "LR",
    align: "UL",
    nodesep: 90,
    ranksep: 180,
    edgesep: 52,
    marginx: 48,
    marginy: 48
  });

  const rawNodes = nodes.map((node) => {
    const size = node.type === "folder"
      ? { width: 256, height: 128 }
      : node.type === "file"
        ? { width: 224, height: 112 }
        : { width: 192, height: 72 };

    dagreGraph.setNode(node.id, size);
    return node;
  });

  const rawEdges = edges.map((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
    return edge;
  });

  dagre.layout(dagreGraph);

  const positionedNodes = rawNodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2
      }
    } as GraphNode;
  });

  return { nodes: positionedNodes, edges: rawEdges };
};
