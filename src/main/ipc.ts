import { ipcMain, WebContents, dialog } from "electron";
import { CodeAnalyzer } from "./analyzer";
import { IRBuilder } from "./ir";
import { CodeWatcher } from "./watcher";

export const setupIpcHandlers = (webContents?: WebContents) => {
  const analyzer = new CodeAnalyzer();
  const builder = new IRBuilder();
  let currentGraph: any = { functions: {}, files: {} };
  
  const watcher = new CodeWatcher(analyzer, builder, (updatedGraph) => {
    currentGraph = updatedGraph;
    if (webContents) {
      webContents.send("graph-updated", currentGraph);
    }
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

  ipcMain.handle("load-project", async (event, folderPath: string) => {
    console.log(`[IPC] Loading project from: ${folderPath}`);
    
    analyzer.loadProject(folderPath);
    const graph = builder.buildIR(analyzer);
    
    // Save current graph state for lazy requests (Convert Map to JSON-friendly Object)
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

  ipcMain.handle("get-graph", async () => {
    console.log("[IPC] Getting graph...");
    return currentGraph;
  });

  ipcMain.handle("get-functions-by-file", async (_event, fileId: string) => {
    const raw = builder.getRawGraph();
    const fileNode = raw.files.get(fileId);
    if (!fileNode) {
      return [];
    }

    return fileNode.functions
      .map((fnId) => raw.functions.get(fnId))
      .filter((fn): fn is NonNullable<typeof fn> => Boolean(fn));
  });

  ipcMain.handle("get-function-calls", async (_event, functionId: string) => {
    const raw = builder.getRawGraph();
    const fnNode = raw.functions.get(functionId);
    if (!fnNode) {
      return [];
    }

    return fnNode.calls
      .map((fnId) => raw.functions.get(fnId))
      .filter((fn): fn is NonNullable<typeof fn> => Boolean(fn));
  });

  ipcMain.handle("get-incoming-calls", async (_event, functionId: string) => {
    const raw = builder.getRawGraph();
    const callers = [] as typeof raw.functions extends Map<string, infer T> ? T[] : never[];

    for (const fn of raw.functions.values()) {
      if (fn.calls.includes(functionId)) {
        callers.push(fn);
      }
    }

    return callers;
  });
};
