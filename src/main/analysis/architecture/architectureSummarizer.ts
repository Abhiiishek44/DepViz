import type { ArchitectureSummary, Domain, RequestFlow, SystemOverview, TechnologySummary } from "./types";

export const summarizeArchitecture = (
  system: SystemOverview,
  technology: TechnologySummary,
  domains: Domain[],
  flows: RequestFlow[]
): ArchitectureSummary => {
  const domainNames = domains.map((domain) => domain.name.toLowerCase());
  const hasVisualization = domainNames.some((name) => name.includes("visual"));
  const hasAnalysis = domainNames.some((name) => name.includes("analysis"));
  const hasGraph = domainNames.some((name) => name.includes("graph"));

  let purpose = "Application platform";
  if (hasVisualization && hasAnalysis && hasGraph) {
    purpose = "Interactive repository architecture visualization platform";
  } else if (hasAnalysis) {
    purpose = "Repository analysis engine";
  } else if (hasVisualization) {
    purpose = "Interactive visualization workspace";
  } else if (domains.length > 0) {
    purpose = `${domains[0].name} platform`;
  }

  const architecture = `${system.architectureStyle}${technology.frontend.length ? " with UI" : ""}`;
  const flow = flows[0];
  const mainFlow = flow
    ? flow.entry.includes("/api") || flow.steps.some((step) => step.includes("api"))
      ? "Client → Dashboard → API Routes → Services → Database"
      : flow.entry.includes("Electron") || flow.steps.some((step) => step.includes("ipc"))
        ? "Renderer UI → IPC Channel → Runtime"
        : `${flow.entry} → ${flow.steps.slice(0, 3).join(" → ")}`
    : "Client → API Routes → Services → Database";
  const authentication = technology.auth[0] || "None";
  const communication = system.communicationPattern;

  return {
    purpose,
    architecture,
    mainFlow,
    authentication,
    communication,
  };
};
