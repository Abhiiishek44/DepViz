import type { RequestFlow, ServiceGraph } from "./types";
import type { RouteDefinition } from "./routeDetector";

const findServiceById = (serviceGraph: ServiceGraph, id?: string) =>
  serviceGraph.nodes.find((node) => node.id === id);

const collectDownstream = (serviceGraph: ServiceGraph, start: string, maxDepth = 4) => {
  const steps: string[] = [];
  const visited = new Set<string>();

  const dfs = (current: string, depth: number) => {
    if (depth > maxDepth) return;
    for (const edge of serviceGraph.edges) {
  if (edge.from !== current) continue;
  if (visited.has(edge.to)) continue;
  visited.add(edge.to);
  steps.push(edge.to);
  dfs(edge.to, depth + 1);
    }
  };

  dfs(start, 0);
  return steps;
};

export const analyzeRequestLifecycles = (
  routes: RouteDefinition[],
  serviceGraph: ServiceGraph
): RequestFlow[] => {
  const flows: RequestFlow[] = routes.map((route) => {
    const controller = route.controller ? findServiceById(serviceGraph, route.controller) : undefined;
    const entry = `${route.method} ${route.path}`;
    const steps = [] as string[];

    if (controller) {
      steps.push(controller.id);
      steps.push(...collectDownstream(serviceGraph, controller.id));
    }

    return {
      name: route.name || entry,
      entry,
      steps: steps.length ? steps : [route.controller || "Handler"],
    };
  });

  if (flows.length === 0) {
    const ipcHandlers = serviceGraph.nodes.filter((node) => node.kind === "ipc-handler");
    for (const handler of ipcHandlers) {
      const steps = ["Renderer UI", "IPC Channel", handler.id, ...collectDownstream(serviceGraph, handler.id)];
      flows.push({
        name: "Repository Analysis Flow",
        entry: "Electron IPC",
        steps,
      });
    }
  }

  return flows;
};
