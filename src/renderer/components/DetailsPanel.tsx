import { FileCode2, TerminalSquare, Clock, Box } from 'lucide-react';

export const DetailsPanel = ({ selectedNode }: { selectedNode: any }) => {
  if (!selectedNode) {
    return (
      <div className="w-72 bg-dark-900 border-l border-zinc-800 p-4 flex flex-col bg-panel-bg backdrop-blur-md">
        <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm text-center">
          Select a node to view details
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-dark-900 border-l border-zinc-800 flex flex-col bg-panel-bg backdrop-blur-md overflow-hidden text-sm">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          {selectedNode.type === 'file' ? <FileCode2 className="w-5 h-5 text-emerald-400" /> : <TerminalSquare className="w-5 h-5 text-purple-400" />}
          <h2 className="font-semibold text-gray-200 truncate">{selectedNode.label || 'Node'}</h2>
        </div>
        <p className="text-xs text-zinc-500 truncate">{selectedNode.path || 'No path available'}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar text-zinc-400">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Details</h3>
          <div className="grid grid-cols-2 gap-y-2 text-xs">
            <span className="text-zinc-500">Type</span>
            <span className="text-right text-gray-300">{selectedNode.type}</span>
            
            <span className="text-zinc-500">Size</span>
            <span className="text-right text-gray-300">{selectedNode.size || 'N/A'}</span>
            
            <span className="text-zinc-500">Imports</span>
            <span className="text-right text-gray-300">{selectedNode.imports || 0}</span>
            
            <span className="text-zinc-500">Functions</span>
            <span className="text-right text-gray-300">{selectedNode.count || 0}</span>
            
            <span className="text-zinc-500">Modified</span>
            <span className="text-right text-gray-300 truncate">{selectedNode.lastModified || 'N/A'}</span>
          </div>
        </div>

        {selectedNode.type === 'file' && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Dependencies</h3>
            <div className="space-y-2">
              <div className="bg-zinc-800/30 border border-zinc-800/50 p-2 rounded-md flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Box className="w-3.5 h-3.5 text-orange-400" />
                  <span>react</span>
                </div>
                <span className="text-zinc-600">^18.2.0</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
