import { contextBridge, ipcRenderer } from "electron";

const api = {
  selectProject: () => ipcRenderer.invoke("select-project"),
  loadProject: (folderPath: string) => ipcRenderer.invoke("load-project", folderPath),
  getGraph: () => ipcRenderer.invoke("get-graph"),
  getFunctionsByFile: (fileId: string) => ipcRenderer.invoke("get-functions-by-file", fileId),
  getFunctionCalls: (functionId: string) => ipcRenderer.invoke("get-function-calls", functionId),
  getIncomingCalls: (functionId: string) => ipcRenderer.invoke("get-incoming-calls", functionId),
  extractArchitecture: () => ipcRenderer.invoke("extract-architecture"),
  onGraphUpdated: (callback: (graph: any) => void) => {
    ipcRenderer.on("graph-updated", (_event, graph) => callback(graph));
  }
};

contextBridge.exposeInMainWorld("api", api);

export type AppApi = typeof api;
