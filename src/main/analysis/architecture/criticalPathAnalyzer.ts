import type { CriticalPath, Importance, RequestFlow } from "./types";

const HIGH_PRIORITY_KEYWORDS = ["auth", "login", "payment", "billing", "checkout", "upload", "admin"];

const inferImportance = (name: string): Importance =>
  HIGH_PRIORITY_KEYWORDS.some((kw) => name.toLowerCase().includes(kw)) ? "high" : "medium";

export const analyzeCriticalPaths = (flows: RequestFlow[]): CriticalPath[] => {
  return flows
    .filter((flow) => flow.steps.length > 0)
    .map((flow) => ({
      name: flow.name,
      importance: inferImportance(flow.name),
      path: [flow.entry, ...flow.steps],
    }));
};
