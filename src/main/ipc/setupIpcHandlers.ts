import { dialog, ipcMain, WebContents } from "electron";
import { ArchitectureExtractor } from "../analysis/architectureExtractor";
import { CodeAnalyzer } from "../analysis/codeAnalyzer";
import { IRBuilder } from "../analysis/irBuilder";
import { CodeWatcher } from "../watch/codeWatcher";

export const setupIpcHandlers = (webContents?: WebContents) => {
  const analyzer = new CodeAnalyzer();
  const builder = new IRBuilder();
  let currentGraph: unknown = { functions: {}, files: {} };
  let currentProjectPath = "";

  const watcher = new CodeWatcher(analyzer, builder, (updatedGraph) => {
    currentGraph = updatedGraph;
    webContents?.send("graph-updated", currentGraph);
  });

  ipcMain.handle("select-project", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle("load-project", async (_event, folderPath: string) => {
    console.log(`[IPC] Loading project from: ${folderPath}`);

    currentProjectPath = folderPath;
    analyzer.loadProject(folderPath);
    const graph = builder.buildIR(analyzer);

    currentGraph = {
      functions: Object.fromEntries(graph.functions),
      files: Object.fromEntries(graph.files)
    };

    watcher.watch(folderPath);

    return {
      success: true,
      message: `Built IR Graph. Found ${graph.files.size} files and ${graph.functions.size} functions. Watching for changes.`
    };
  });

  ipcMain.handle("extract-architecture", async () => {
    console.log("[IPC] Extracting architecture...");
    const raw = builder.getRawGraph();

    if (raw.files.size === 0) {
      return { error: "No project loaded. Load a project first." };
    }

    const extractor = new ArchitectureExtractor(raw, currentProjectPath);
    return extractor.extract();
  });

  ipcMain.handle("get-graph", async () => {
    console.log("[IPC] Getting graph...");
    return currentGraph;
  });

  ipcMain.handle("get-functions-by-file", async (_event, fileId: string) => {
    const raw = builder.getRawGraph();
    const fileNode = raw.files.get(fileId);
    if (!fileNode) return [];

    return fileNode.functions
      .map((fnId) => raw.functions.get(fnId))
      .filter((fn): fn is NonNullable<typeof fn> => Boolean(fn));
  });

  ipcMain.handle("get-function-calls", async (_event, functionId: string) => {
    const raw = builder.getRawGraph();
    const fnNode = raw.functions.get(functionId);
    if (!fnNode) return [];

    return fnNode.calls
      .map((fnId) => raw.functions.get(fnId))
      .filter((fn): fn is NonNullable<typeof fn> => Boolean(fn));
  });

  ipcMain.handle("get-incoming-calls", async (_event, functionId: string) => {
    const raw = builder.getRawGraph();
    const callers = [];

    for (const fn of raw.functions.values()) {
      if (fn.calls.includes(functionId)) {
        callers.push(fn);
      }
    }

    return callers;
  });
};
