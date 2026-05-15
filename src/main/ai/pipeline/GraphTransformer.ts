import { AIOutput, AIOutputNode, AIOutputEdge, AIContainer } from './schemas';
import { ReactFlowGraph, RFNode, RFEdge } from './types';

export class GraphTransformer {
  /**
   * Transforms validated AI output into a React Flow-ready structure.
   */
  transform(aiOutput: AIOutput): ReactFlowGraph {
    const nodes: RFNode[] = aiOutput.nodes.map((node: AIOutputNode) => ({
      id: node.id,
      type: 'customNode',
      data: {
        label: node.label,
        layer: node.layer,
        description: node.description,
        techStack: node.techStack,
      },
      position: node.position,
      parentId: node.container,
      extent: node.container ? 'parent' : undefined,
    }));

    const edges: RFEdge[] = aiOutput.edges.map((edge: AIOutputEdge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: edge.animated || edge.type === 'async' || edge.type === 'event',
      type: 'smoothstep',
    }));

    // Add container nodes if they exist
    if (aiOutput.containers) {
      aiOutput.containers.forEach((container: AIContainer) => {
        nodes.push({
          id: container.id,
          type: 'group',
          data: { label: container.label, layer: 'infrastructure' }, // Groups often represent infrastructure
          position: { x: 0, y: 0 }, // Should be calculated or provided by AI
          // Group container logic here
        });
      });
    }

    return {
      title: aiOutput.title,
      nodes,
      edges,
    };
  }
}
