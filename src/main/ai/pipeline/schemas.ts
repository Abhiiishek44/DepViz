import { z } from 'zod';

export const NodeSchema = z.object({
  id: z.string(),
  type: z.enum(['service', 'database', 'api', 'external', 'queue', 'cache']),
  label: z.string(),
  layer: z.enum(['presentation', 'application', 'domain', 'infrastructure', 'external']),
  container: z.string().optional(),
  description: z.string().optional(),
  techStack: z.array(z.string()).optional(),
});

export const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.enum(['sync', 'async', 'event']),
  label: z.string().optional(),
  protocol: z.string().optional(),
});

export const ContainerSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string().optional(),
});

export const ArchitectureJSONSchema = z.object({
  system: z.unknown(),
  domains: z.array(z.unknown()),
  requestFlows: z.array(z.unknown()),
  serviceGraph: z.unknown(),
  runtimeGraph: z.unknown(),
  databaseAccessGraph: z.unknown(),
  criticalPaths: z.array(z.unknown()),
  entrypoints: z.array(z.unknown()),
  technology: z.unknown(),
  summary: z.unknown(),
  dependencyIntelligence: z.unknown(),
  metadata: z.unknown().optional(),
});


// Output schema (what Gemini returns before transformation)
export const AIOutputNodeSchema = NodeSchema.extend({
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const AIOutputEdgeSchema = EdgeSchema.extend({
  animated: z.boolean().optional().default(false),
});

export const AIOutputSchema = z.object({
  title: z.string(),
  nodes: z.array(AIOutputNodeSchema),
  edges: z.array(AIOutputEdgeSchema),
  containers: z.array(ContainerSchema).optional(),
});

export type AIOutput = z.infer<typeof AIOutputSchema>;
export type AIOutputNode = z.infer<typeof AIOutputNodeSchema>;
export type AIOutputEdge = z.infer<typeof AIOutputEdgeSchema>;
export type AIContainer = z.infer<typeof ContainerSchema>;

