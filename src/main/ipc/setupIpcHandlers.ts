import "dotenv/config";
import { dialog, ipcMain, WebContents } from "electron";
import { ArchitectureExtractor } from "../analysis/architectureExtractor";
import { CodeAnalyzer } from "../analysis/codeAnalyzer";
import { IRBuilder } from "../analysis/irBuilder";
import { CodeWatcher } from "../watch/codeWatcher";
import { ArchitecturePipeline } from "../ai/pipeline/ArchitecturePipeline";
import dotenv from "dotenv";
dotenv.config();
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
    console.log("[IPC] Running architecture extraction...");
    return extractor.extract();
  });

  ipcMain.handle("generate-ai-architecture", async () => {
    console.log("[IPC] Starting AI architecture generation...");
    const raw = builder.getRawGraph();
    if (raw.files.size === 0) {
      return { error: "No project loaded. Load a project first." };
    }

    try {
      const extractor = new ArchitectureExtractor(raw, currentProjectPath);
      const archJson = extractor.extract();

      // For MVP, we use the key from environment
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return { error: "GEMINI_API_KEY not found in environment. Please set it to use AI features." };
      }

      console.log("[IPC] Executing AI Pipeline...");
      const pipeline = new ArchitecturePipeline(apiKey);
      const result = await pipeline.run(archJson);

      return { success: true, graph: result };
    } catch (error: any) {
      console.error("[IPC] AI Generation failed:", error);
      return { error: error.message || "Failed to generate AI architecture" };
    }
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
