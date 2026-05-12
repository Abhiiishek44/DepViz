import type { Domain, ServiceGraph } from "./types";
import { inferDomain } from "./utils";

export const analyzeDomains = (serviceGraph: ServiceGraph): Domain[] => {
  const domainMap = new Map<string, Domain>();

  for (const node of serviceGraph.nodes) {
    const { name, filePath, layer, kind } = node;
    const { name: domainName, responsibility } = inferDomain(`${name} ${filePath} ${layer} ${kind}`);

    if (!domainMap.has(domainName)) {
      domainMap.set(domainName, {
        name: domainName,
        responsibility,
        services: []
      });
    }

    const domain = domainMap.get(domainName)!;
    if (!domain.services.includes(name)) {
      domain.services.push(name);
    }
  }

  return Array.from(domainMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};
