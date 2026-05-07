import { useState, useEffect } from "react";
import { GraphView } from "./GraphView";
import { Toolbar } from "./components/Toolbar";
import { Sidebar } from "./components/Sidebar";
import { DetailsPanel } from "./components/DetailsPanel";
import { StatusBar } from "./components/StatusBar";

const App = () => {
  const [status, setStatus] = useState<string>("Idle");
  const [graph, setGraph] = useState<any>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [lastScan, setLastScan] = useState<string>("");

  useEffect(() => {
    // Listen for graph updates broadcasted by main process (watcher)
    window.api.onGraphUpdated((updateEvent: any) => {
      if (updateEvent?.type === 'PATCH') {
        const patch = updateEvent.patch;
        console.log("Live Updated Patch:", patch);
        
        setGraph((prev: any) => {
          if (!prev) return prev;
          
          // Shallow copy to break reference and trigger react re-render
          const next = {
            functions: { ...prev.functions },
            files: { ...prev.files }
          };
          
          // Apply added & updated nodes
          patch.addedNodes.concat(patch.updatedNodes).forEach((node: any) => {
            if (node.type === "file") {
              next.files[node.id] = { ...next.files[node.id], ...node };
            } else if (node.type === "function") {
              next.functions[node.id] = { ...next.functions[node.id], ...node };
            }
          });
          
          // Apply removed nodes
          patch.removedNodes.forEach((id: string) => {
            delete next.files[id];
            delete next.functions[id];
          });
          
          return next;
        });
      } else {
        // Fallback for full snapshot - ensure it has data
        if (updateEvent && updateEvent.files) {
          console.log("Live Updated Full Snapshot:", updateEvent);
          setGraph(updateEvent);
        }
      }
      
      setStatus(`Watcher applied incremental patch`);
      setLastScan(new Date().toLocaleTimeString());
    });
  }, []);

  const handleLoadProject = async () => {
    setStatus("Selecting project directory...");
    const folderPath = await window.api.selectProject();
    if (!folderPath) {
      setStatus("Project selection canceled.");
      return;
    }
    
    // Extract base folder name
    const folderName = folderPath.split(/[\\/]/).pop();
    setProjectName(folderName);
    
    setStatus(`Loading project at ${folderPath}...`);
    const res = await window.api.loadProject(folderPath);
    setStatus(res.message);
    setLastScan(new Date().toLocaleTimeString());

    // Automatically retrieve and display the graph after parsing completes!
    const newGraph = await window.api.getGraph();
    if (newGraph) {
      setGraph(newGraph);
    }
  };

  const handleRefresh = async () => {
    setStatus("Refreshing graph...");
    const newGraph = await window.api.getGraph();
    setGraph(newGraph);
    setStatus(`Graph refreshed.`);
    setLastScan(new Date().toLocaleTimeString());
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-900 text-gray-200 overflow-hidden font-sans">
      <Toolbar 
        onRefresh={handleRefresh} 
        onSelectProject={handleLoadProject} 
        projectStatus={status} 
      />
      
      <div className="flex-1 flex overflow-hidden min-h-0">
        <Sidebar graph={graph} onNodeSelect={(node) => {
          setSelectedNode(node);
          if (node.id) {
            document.dispatchEvent(new CustomEvent('sidebar-select', { detail: node.id }));
          }
        }} />
        
        <div className="flex-1 flex flex-col min-w-0 bg-[#0b1020] relative">
          {graph ? (
            <div className="absolute inset-0">
              <GraphView graph={graph} onNodeSelect={setSelectedNode} />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center flex-col text-zinc-500">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <p className="text-sm">No project loaded.</p>
              <p className="text-xs mt-1 text-zinc-600">Select a project to visualize dependencies.</p>
              <button 
                onClick={handleLoadProject}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
                >
                Select Project
              </button>
            </div>
          )}
        </div>

        <DetailsPanel selectedNode={selectedNode} />
      </div>

      <StatusBar 
        projectName={projectName} 
        fileCount={graph?.files ? Object.keys(graph.files).length : 0} 
        functionCount={graph?.functions ? Object.keys(graph.functions).length : 0}
        lastScan={lastScan}
      />
    </div>
  );
};

export default App;
