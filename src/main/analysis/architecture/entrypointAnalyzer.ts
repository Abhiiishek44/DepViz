import type { CodeGraph } from "../types";
import type { EntryPoint } from "./types";
import { getBaseName, prettify } from "./utils";

const ENTRY_CANDIDATES = [
  "index",
  "main",
  "app",
  "server",
  "bootstrap",
];

export const analyzeEntrypoints = (graph: CodeGraph): EntryPoint[] => {
  const entrypoints: EntryPoint[] = [];

  for (const file of graph.files.values()) {
    const filePath = file.path || file.id;
    const base = getBaseName(filePath).toLowerCase();
    if (!ENTRY_CANDIDATES.includes(base)) continue;

    const type = file.imports.some((imp) => imp.includes("electron"))
      ? "electron-main"
      : file.imports.some((imp) => imp.includes("express"))
        ? "express-server"
        : file.imports.some((imp) => imp.includes("react"))
          ? "react-entry"
          : "entry";

    entrypoints.push({
      name: prettify(base),
      type,
      filePath,
    });
  }

  return entrypoints;
};
