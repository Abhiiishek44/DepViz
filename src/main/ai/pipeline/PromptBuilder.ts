import { ArchitectureJSON } from './types';

export const ARCHITECTURE_PROMPT_TEMPLATE = `
You are a software architect. Analyze the architecture JSON below and return
a React Flow visualization JSON.

RULES:
1. Return ONLY valid JSON. No explanation. No markdown code blocks.
2. Structure must match EXACTLY:
{
  "title": string,
  "nodes": [{"id", "type", "label", "layer", "position": {"x", "y"}, "container", "description", "techStack"}],
  "edges": [{"id", "source", "target", "type", "animated", "label"}],
  "containers": [{"id", "label"}]
}
3. Allowed Values:
   - node.type: 'service', 'database', 'api', 'external', 'queue', 'cache'
   - node.layer: 'presentation', 'application', 'domain', 'infrastructure', 'external'
   - edge.type: 'sync', 'async', 'event'
4. Layout Rules: 
   - Group nodes by layer (top to bottom): 
     - presentation (Y: 0-200)
     - application (Y: 300-500)
     - domain (Y: 600-800)
     - infrastructure (Y: 900-1100)
     - external (Y: 1200+)
   - Space nodes horizontally (X: 0, 300, 600, etc.) to avoid overlaps.
5. If a node has a container, it will be nested in that container in React Flow.
6. Edges should be animated if they represent 'async' or 'event' types.
`;

export class PromptBuilder {
  build(data: ArchitectureJSON): string {
    return JSON.stringify(data, null, 2);
  }

  getSystemPrompt(): string {
    return ARCHITECTURE_PROMPT_TEMPLATE;
  }
}
