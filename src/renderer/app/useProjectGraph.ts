import { useEffect, useState } from "react";
import { GraphPatch, NodeMetadata } from "../../shared/protocol";
import { CodeGraph } from "../features/graph/types/graphTypes";

type GraphUpdateEvent =
  | { type: "PATCH"; timestamp: number; patch: GraphPatch }
  | CodeGraph;

export const useProjectGraph = () => {
  const [status, setStatus] = useState("Idle");
  const [graph, setGraph] = useState<CodeGraph | null>(null);
  const [projectName, setProjectName] = useState("");
  const [lastScan, setLastScan] = useState("");

  useEffect(() => {
    window.api.onGraphUpdated((updateEvent: GraphUpdateEvent) => {
      if ("type" in updateEvent && updateEvent.type === "PATCH") {
        console.log("Live Updated Patch:", updateEvent.patch);
        setGraph((prev) => applyGraphPatch(prev, updateEvent.patch));
      } else if (updateEvent && "files" in updateEvent) {
        console.log("Live Updated Full Snapshot:", updateEvent);
        setGraph(updateEvent);
      }

      setStatus("Watcher applied incremental patch");
      setLastScan(new Date().toLocaleTimeString());
    });
  }, []);

  const loadProject = async () => {
    setStatus("Selecting project directory...");
    const folderPath = await window.api.selectProject();
    if (!folderPath) {
      setStatus("Project selection canceled.");
      return;
    }

    setProjectName(folderPath.split(/[\\/]/).pop() || "");
    setStatus(`Loading project at ${folderPath}...`);

    const res = await window.api.loadProject(folderPath);
    setStatus(res.message);
    setLastScan(new Date().toLocaleTimeString());

    const newGraph = await window.api.getGraph();
    if (newGraph) {
      setGraph(newGraph);
    }
  };

  const refreshGraph = async () => {
    setStatus("Refreshing graph...");
    const newGraph = await window.api.getGraph();
    setGraph(newGraph);
    setStatus("Graph refreshed.");
    setLastScan(new Date().toLocaleTimeString());
  };

  return {
    status,
    graph,
    projectName,
    lastScan,
    loadProject,
    refreshGraph
  };
};

const applyGraphPatch = (graph: CodeGraph | null, patch: GraphPatch) => {
  if (!graph) return graph;

  const next: CodeGraph = {
    functions: { ...graph.functions },
    files: { ...graph.files }
  };

  patch.addedNodes.concat(patch.updatedNodes).forEach((node) => applyNodePatch(next, node));

  patch.removedNodes.forEach((id) => {
    delete next.files[id];
    delete next.functions[id];
  });

  return next;
};

const applyNodePatch = (graph: CodeGraph, node: NodeMetadata) => {
  if (node.type === "file") {
    graph.files[node.id] = {
      id: node.id,
      path: node.path || node.id,
      functions: node.functions || [],
      imports: node.imports || []
    };
  }

  if (node.type === "function") {
    graph.functions[node.id] = {
      id: node.id,
      name: node.name,
      file: node.path || "",
      params: node.params || [],
      calls: node.calls || []
    };
  }
};
