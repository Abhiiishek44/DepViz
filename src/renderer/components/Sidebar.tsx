import React, { useMemo, useState, useEffect } from 'react';
import { Folder, FolderOpen, FileCode2, TerminalSquare, Box, ArrowRight, CornerDownRight, ChevronRight, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

type TreeNode = {
  name: string;
  path: string;
  type: 'folder' | 'file';
  fileData?: any;
  children: Record<string, TreeNode>;
};

export const Sidebar = ({ graph, onNodeSelect }: { graph?: any, onNodeSelect?: (node: any) => void }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Sync with global graph selections
  useEffect(() => {
    const handleGraphSelect = (e: any) => {
      if (e.detail) {
        setSelectedPath(e.detail);
        // Expand parents...
        const parts = e.detail.split('/');
        const toExpand = new Set(expandedFolders);
        let curr = '';
        for (let i = 0; i < parts.length - 1; i++) {
          curr += (i > 0 ? '/' : '') + parts[i];
          toExpand.add(curr);
        }
        setExpandedFolders(toExpand);
      }
    };
    document.addEventListener('graph-select', handleGraphSelect);
    return () => document.removeEventListener('graph-select', handleGraphSelect);
  }, [expandedFolders]);

  const tree = useMemo(() => {
    if (!graph || !graph.files) return { children: {} } as TreeNode;
    
    // First figure out the common prefix correctly
    const filePaths = Object.values(graph.files).map((f: any) => f.path);
    if (!filePaths.length) return { children: {} } as TreeNode;

    const getSegments = (p: string) => p.split('/').filter(Boolean);
    const segmentsList = filePaths.map(getSegments);
    
    let commLen = segmentsList[0].length;
    for (const seg of segmentsList) {
      let match = 0;
      for (let i = 0; i < Math.min(commLen, seg.length); i++) {
        if (seg[i] === segmentsList[0][i]) match++;
        else break;
      }
      commLen = match;
    }
    
    const rootNodes: Record<string, TreeNode> = {};

    Object.values(graph.files).forEach((file: any) => {
      const segments = getSegments(file.path).slice(commLen);
      let currentMap = rootNodes;
      
      let currentPath = '';

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        currentPath += (currentPath ? '/' : '') + seg;
        
        if (!currentMap[seg]) {
          currentMap[seg] = {
            name: seg,
            path: currentPath,
            type: i === segments.length - 1 ? 'file' : 'folder',
            children: {},
            fileData: i === segments.length - 1 ? file : undefined
          };
        }
        currentMap = currentMap[seg].children;
      }
    });
    
    return { children: rootNodes } as TreeNode;
  }, [graph]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleFileClick = (node: TreeNode) => {
    if (!node.fileData || !onNodeSelect) return;
    
    setSelectedPath(node.fileData.id);
    onNodeSelect({
      type: "file",
      label: node.name,
      path: node.fileData.path,
      count: node.fileData.functions?.length || 0,
      imports: node.fileData.imports?.length || 0,
      id: node.fileData.id
    });
  };

  const renderTree = (nodes: TreeNode[], depth = 0) => {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    }).map(node => {
      const isExpanded = expandedFolders.has(node.path);
      const isSelected = selectedPath === (node.type === 'file' ? node.fileData?.id : node.path);
      
      return (
        <div key={node.path} className="select-none text-sm">
          <div 
            onClick={() => {
              if (node.type === 'folder') toggleFolder(node.path);
              else handleFileClick(node);
            }}
            className={clsx(
              "flex items-center py-1 px-2 cursor-pointer rounded-md transition-colors",
              isSelected ? "bg-blue-600/20 text-blue-100" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            <div className="flex items-center gap-2 w-full truncate">
              {node.type === 'folder' && (
                <div className="flex items-center gap-1.5 w-full">
                  <span className="text-zinc-500 w-3 h-3 flex items-center justify-center">
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </span>
                  {isExpanded ? <FolderOpen className="w-[14px] h-[14px] text-blue-400 shrink-0" /> : <Folder className="w-[14px] h-[14px] text-blue-400 shrink-0" />}
                  <span className="truncate text-xs">{node.name}</span>
                </div>
              )}
              {node.type === 'file' && (
                <div className="flex items-center gap-1.5 w-full pl-[18px]">
                  <FileCode2 className="w-[14px] h-[14px] text-emerald-400 shrink-0" />
                  <span className="truncate text-xs">{node.name}</span>
                </div>
              )}
            </div>
          </div>
          {node.type === 'folder' && isExpanded && (
            <div>
              {renderTree(Object.values(node.children), depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-64 bg-dark-900 border-r border-zinc-800 flex flex-col h-full bg-panel-bg backdrop-blur-md">
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between shadow-sm z-10">
        <h2 className="text-xs font-semibold text-gray-200 tracking-wider uppercase">Project Explorer</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {!graph || !graph.files ? (
          <div className="text-xs text-zinc-500 p-4 text-center">No project to explore. Select one to begin!</div>
        ) : (
          renderTree(Object.values(tree.children))
        )}
      </div>

      <div className="border-t border-zinc-800 flex flex-col bg-zinc-900/50">
        <div className="p-3 border-b border-zinc-800/50 shadow-sm z-10">
          <h2 className="text-xs font-semibold text-gray-200 tracking-wider uppercase">Legend</h2>
        </div>
        <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <LegendItem icon={<Folder className="w-4 h-4 text-blue-400" />} label="Folder" />
          <LegendItem icon={<FileCode2 className="w-4 h-4 text-emerald-400" />} label="JavaScript File" />
          <LegendItem icon={<TerminalSquare className="w-4 h-4 text-purple-400" />} label="Function" />
          <LegendItem icon={<Box className="w-4 h-4 text-orange-400" />} label="External Dependency" />
          
          <div className="pt-2 border-t border-zinc-800/50 space-y-3">
            <LegendEdge icon={<ArrowRight className="w-4 h-4 text-zinc-400" />} label="Imports" />
            <LegendEdge icon={<CornerDownRight className="w-4 h-4 text-zinc-400" />} label="Function Calls" dashed />
          </div>
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <div className="flex items-center gap-3 text-xs text-zinc-400 group hover:text-zinc-300 transition-colors cursor-default">
    <div className="w-6 h-6 flex items-center justify-center bg-zinc-900 rounded-md border border-zinc-800 shadow-sm">
      {icon}
    </div>
    <span>{label}</span>
  </div>
);

const LegendEdge = ({ icon, label, dashed }: { icon: React.ReactNode, label: string, dashed?: boolean }) => (
  <div className="flex items-center gap-3 text-xs text-zinc-400 group hover:text-zinc-300 transition-colors cursor-default">
    <div className={`w-6 border-t-2 ${dashed ? 'border-dashed' : 'border-solid'} border-zinc-500 group-hover:border-zinc-400 transition-colors`} />
    <span>{label}</span>
  </div>
);
