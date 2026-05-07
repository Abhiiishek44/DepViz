import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls, 
  MiniMap,
  MarkerType,
  ReactFlowInstance
} from "reactflow";
import dagre from "dagre";

type FunctionNode = {
  id: string;
  name: string;
  file: string;
  params: string[];
  calls: string[];
};

type FileNode = {
  id: string;
  path: string;
  functions: string[];
  imports: string[];
};

type FolderNode = {
  id: string;
  name: string;
  files: string[];
};

type CodeGraph = {
  functions: Record<string, FunctionNode>;
  files: Record<string, FileNode>;
};

type DrillState = {
  expandedFolders: Set<string>;
  expandedFiles: Set<string>;
  expandedFunctions: Set<string>;
  expandedIncoming: Set<string>;
};

type NodeKind = "folder" | "file" | "function";

type GraphNode = Node<{ label: JSX.Element }> & { type: NodeKind };

const EDGE_STYLE = {
  smooth: "smoothstep" as const,
  arrow: MarkerType.ArrowClosed
};

const getNodeLabel = (fn: FunctionNode) => (
  <div style={{ padding: '10px', minWidth: '160px' }}>
    <strong style={{ fontSize: '14px', display: 'block' }}>{fn.name || 'anonymous'}</strong>
    <div style={{ fontSize: '10px', color: '#666', marginTop: '4px', wordBreak: 'break-all' }}>
      {fn.file.split('/').slice(-2).join('/')}
    </div>
    <div style={{ fontSize: '9px', color: '#aaa', marginTop: '4px' }}>
      Params: {fn.params.length} • Calls: {fn.calls.length}
    </div>
  </div>
);

const getFileLabel = (file: FileNode) => (
  <div style={{ padding: '10px', minWidth: '190px' }}>
    <strong style={{ fontSize: '14px', display: 'block' }}>📄 File</strong>
    <div style={{ fontSize: '10px', color: '#666', marginTop: '4px', wordBreak: 'break-all' }}>
      {file.path.split('/').slice(-2).join('/')}
    </div>
    <div style={{ fontSize: '9px', color: '#aaa', marginTop: '4px' }}>
      Functions: {file.functions.length} • Imports: {file.imports.length}
    </div>
  </div>
);

const getFolderLabel = (folder: FolderNode) => (
  <div style={{ padding: '12px', minWidth: '200px' }}>
    <strong style={{ fontSize: '15px', display: 'block' }}>📁 {folder.name}</strong>
    <div style={{ fontSize: '10px', color: '#666', marginTop: '6px' }}>
      Files: {folder.files.length}
    </div>
  </div>
);

const getPathSegments = (path: string) => path.split('/').filter(Boolean);

const getCommonRootSegments = (paths: string[]) => {
  if (paths.length === 0) return [] as string[];
  const segments = paths.map(getPathSegments);
  const minLength = Math.min(...segments.map((seg) => seg.length));
  const root: string[] = [];

  for (let i = 0; i < minLength; i += 1) {
    const segment = segments[0][i];
    if (segments.every((seg) => seg[i] === segment)) {
      root.push(segment);
    } else {
      break;
    }
  }

  return root;
};

const getRelativeSegments = (path: string, rootSegments: string[]) => {
  const segments = getPathSegments(path);
  return segments.slice(rootSegments.length);
};

const buildFolderMap = (files: FileNode[]) => {
  const filePaths = files.map((file) => file.path);
  const rootSegments = getCommonRootSegments(filePaths);
  const folders = new Map<string, FolderNode>();

  for (const file of files) {
    const relativeSegments = getRelativeSegments(file.path, rootSegments);
    const folderName = relativeSegments[0] || "(root)";
    const folderId = `folder:${folderName}`;
    const folder = folders.get(folderId) || { id: folderId, name: folderName, files: [] };
    folder.files.push(file.id);
    folders.set(folderId, folder);
  }

  return Array.from(folders.values());
};

const layoutGraph = (nodes: GraphNode[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 70, marginx: 20, marginy: 20 });

  const rawNodes = nodes.map((node) => {
    const size = node.type === "folder"
      ? { width: 300, height: 120 }
      : node.type === "file"
        ? { width: 280, height: 110 }
        : { width: 260, height: 90 };
    dagreGraph.setNode(node.id, size);
    return node;
  });

  const rawEdges = edges.map((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
    return edge;
  });

  // 2. Perform graph layout
  dagre.layout(dagreGraph);

  // 3. Apply positions
  const positionedNodes = rawNodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
    } as GraphNode;
  });

  return { nodes: positionedNodes, edges: rawEdges };
};

export const GraphView = ({ graph }: { graph: CodeGraph }) => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  const [drillState, setDrillState] = useState<DrillState>({
    expandedFolders: new Set(),
    expandedFiles: new Set(),
    expandedFunctions: new Set(),
    expandedIncoming: new Set()
  });
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<boolean>(true);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const parentMapRef = useRef<Map<string, Set<string>>>(new Map());
  const childMapRef = useRef<Map<string, Set<string>>>(new Map());

  const fileNodes = useMemo(() => Object.values(graph.files), [graph]);
  const folderNodes = useMemo(() => buildFolderMap(fileNodes), [fileNodes]);

  const getParentBreadcrumb = useCallback((nodeId: string) => {
    const breadcrumbs: string[] = [];
    let currentId: string | undefined = nodeId;
    const parents = parentMapRef.current;

    while (currentId) {
      breadcrumbs.unshift(currentId);
      const parentSet = parents.get(currentId);
      const parent = parentSet ? Array.from(parentSet.values())[0] : undefined;
      currentId = parent;
    }
    return breadcrumbs;
  }, []);

  const selectedBreadcrumbs = useMemo(() => {
    if (!selectedNodeId) return [];
    return getParentBreadcrumb(selectedNodeId).map((id) => id.replace(/^folder:/, ""));
  }, [getParentBreadcrumb, selectedNodeId]);

  const focusNodeIds = useMemo(() => {
    if (!focusMode || !selectedNodeId) return new Set<string>();
    const ids = new Set<string>();
    ids.add(selectedNodeId);

    edges.forEach((edge) => {
      if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
        ids.add(edge.source);
        ids.add(edge.target);
      }
    });

    return ids;
  }, [edges, focusMode, selectedNodeId]);

  const linkNodes = useCallback((parentId: string, childId: string) => {
    const parentMap = parentMapRef.current;
    const childMap = childMapRef.current;
    const parents = parentMap.get(childId) || new Set<string>();
    parents.add(parentId);
    parentMap.set(childId, parents);

    const children = childMap.get(parentId) || new Set<string>();
    children.add(childId);
    childMap.set(parentId, children);
  }, []);

  const ensureNode = useCallback((node: GraphNode) => {
    setNodes((prev) => (prev.some((n) => n.id === node.id) ? prev : [...prev, node]));
  }, []);

  const ensureEdge = useCallback((edge: Edge) => {
    setEdges((prev) => (prev.some((e) => e.id === edge.id) ? prev : [...prev, edge]));
  }, []);

  const relayout = useCallback(() => {
    setNodes((currentNodes) => {
      const layout = layoutGraph(currentNodes, edges);
      if (rfInstance) {
        const viewport = rfInstance.getViewport();
        requestAnimationFrame(() => rfInstance.setViewport(viewport));
      }
      return layout.nodes;
    });
  }, [edges, rfInstance]);

  const removeSubtree = useCallback((rootId: string) => {
    const childMap = childMapRef.current;
    const parentMap = parentMapRef.current;
    const toRemove = new Set<string>();
    const queue = [rootId];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      const children = childMap.get(current);
      if (!children) continue;
      for (const child of children) {
        queue.push(child);
        toRemove.add(child);
      }
    }

    setNodes((prev) => prev.filter((node) => !toRemove.has(node.id)));
    setEdges((prev) => prev.filter((edge) => !toRemove.has(edge.source) && !toRemove.has(edge.target)));

    for (const nodeId of toRemove) {
      parentMap.delete(nodeId);
      childMap.delete(nodeId);
    }

    for (const [parentId, children] of childMap.entries()) {
      for (const child of Array.from(children)) {
        if (toRemove.has(child)) {
          children.delete(child);
        }
      }
      if (children.size === 0) {
        childMap.delete(parentId);
      }
    }
  }, []);

  const collapseNode = useCallback((nodeId: string, type: NodeKind) => {
    removeSubtree(nodeId);
    setDrillState((prev) => {
      const next: DrillState = {
        expandedFolders: new Set(prev.expandedFolders),
        expandedFiles: new Set(prev.expandedFiles),
        expandedFunctions: new Set(prev.expandedFunctions),
        expandedIncoming: new Set(prev.expandedIncoming)
      };
      if (type === "folder") {
        next.expandedFolders.delete(nodeId);
      }
      if (type === "file") {
        next.expandedFiles.delete(nodeId);
      }
      if (type === "function") {
        next.expandedFunctions.delete(nodeId);
        next.expandedIncoming.delete(nodeId);
      }
      return next;
    });
    relayout();
  }, [relayout, removeSubtree]);

  const expandFolder = useCallback(async (folderId: string) => {
    if (drillState.expandedFolders.has(folderId)) {
      collapseNode(folderId, "folder");
      return;
    }
    setLoadingNodeId(folderId);
    const folder = folderNodes.find((item) => item.id === folderId);
    if (!folder) {
      setLoadingNodeId(null);
      return;
    }

    folder.files.forEach((fileId) => {
      const file = graph.files[fileId];
      if (!file) return;

      ensureNode({
        id: file.id,
        type: "file",
        position: { x: 0, y: 0 },
        data: { label: getFileLabel(file) },
        style: { border: '2px solid #3b82f6', borderRadius: '6px', background: '#eff6ff' }
      });

      ensureEdge({
        id: `e-folder-${folderId}-${file.id}`,
        source: folderId,
        target: file.id,
        type: EDGE_STYLE.smooth,
        animated: true,
        style: { stroke: '#2563eb', strokeWidth: 2 },
        markerEnd: { type: EDGE_STYLE.arrow, color: '#2563eb' }
      });

      linkNodes(folderId, file.id);
    });

    setDrillState((prev) => ({
      ...prev,
      expandedFolders: new Set(prev.expandedFolders).add(folderId)
    }));
    setLoadingNodeId(null);
    relayout();
  }, [collapseNode, drillState.expandedFolders, ensureEdge, ensureNode, folderNodes, graph.files, linkNodes, relayout]);

  const expandFile = useCallback(async (fileId: string) => {
    if (drillState.expandedFiles.has(fileId)) {
      collapseNode(fileId, "file");
      return;
    }
    setLoadingNodeId(fileId);
    const functions: FunctionNode[] = await window.api.getFunctionsByFile(fileId);
    functions.forEach((fn: FunctionNode) => {
      ensureNode({
        id: fn.id,
        type: "function",
        position: { x: 0, y: 0 },
        data: { label: getNodeLabel(fn) },
        style: { border: '1px solid #777', borderRadius: '5px', background: '#fff' }
      });

      ensureEdge({
        id: `e-file-${fileId}-${fn.id}`,
        source: fileId,
        target: fn.id,
        type: EDGE_STYLE.smooth,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        markerEnd: { type: EDGE_STYLE.arrow, color: '#3b82f6' }
      });

      linkNodes(fileId, fn.id);
    });

    setDrillState((prev) => ({
      ...prev,
      expandedFiles: new Set(prev.expandedFiles).add(fileId)
    }));
    setLoadingNodeId(null);
    relayout();
  }, [drillState.expandedFiles, ensureEdge, ensureNode, relayout]);

  const expandFunctionCalls = useCallback(async (functionId: string) => {
    if (drillState.expandedFunctions.has(functionId)) {
      collapseNode(functionId, "function");
      return;
    }
    setLoadingNodeId(functionId);
    const targets: FunctionNode[] = await window.api.getFunctionCalls(functionId);
    targets.forEach((fn: FunctionNode) => {
      ensureNode({
        id: fn.id,
        type: "function",
        position: { x: 0, y: 0 },
        data: { label: getNodeLabel(fn) },
        style: { border: '1px solid #777', borderRadius: '5px', background: '#fff' }
      });

      ensureEdge({
        id: `e-call-${functionId}-${fn.id}`,
        source: functionId,
        target: fn.id,
        type: EDGE_STYLE.smooth,
        animated: true,
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        markerEnd: { type: EDGE_STYLE.arrow, color: '#f59e0b' }
      });

      linkNodes(functionId, fn.id);
    });

    setDrillState((prev) => ({
      ...prev,
      expandedFunctions: new Set(prev.expandedFunctions).add(functionId)
    }));
    setLoadingNodeId(null);
    relayout();
  }, [drillState.expandedFunctions, ensureEdge, ensureNode, relayout]);

  const expandIncomingCalls = useCallback(async (functionId: string) => {
    if (drillState.expandedIncoming.has(functionId)) {
      collapseNode(functionId, "function");
      return;
    }
    setLoadingNodeId(functionId);
    const callers: FunctionNode[] = await window.api.getIncomingCalls(functionId);
    callers.forEach((fn: FunctionNode) => {
      ensureNode({
        id: fn.id,
        type: "function",
        position: { x: 0, y: 0 },
        data: { label: getNodeLabel(fn) },
        style: { border: '1px solid #777', borderRadius: '5px', background: '#fff' }
      });

      ensureEdge({
        id: `e-incoming-${fn.id}-${functionId}`,
        source: fn.id,
        target: functionId,
        type: EDGE_STYLE.smooth,
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 },
        markerEnd: { type: EDGE_STYLE.arrow, color: '#10b981' }
      });

      linkNodes(functionId, fn.id);
    });

    setDrillState((prev) => ({
      ...prev,
      expandedIncoming: new Set(prev.expandedIncoming).add(functionId)
    }));
    setLoadingNodeId(null);
    relayout();
  }, [drillState.expandedIncoming, ensureEdge, ensureNode, relayout]);

  const handleNodeClick = useCallback((_: unknown, node: Node) => {
    setSelectedNodeId(node.id);
    if (node.type === "folder") {
      expandFolder(node.id);
    } else if (node.type === "file") {
      expandFile(node.id);
    } else if (node.type === "function") {
      expandFunctionCalls(node.id);
    }
  }, [expandFile, expandFolder, expandFunctionCalls]);

  const handleNodeDoubleClick = useCallback((_: unknown, node: Node) => {
    if (node.type === "function") {
      expandIncomingCalls(node.id);
    }
  }, [expandIncomingCalls]);

  useEffect(() => {
    if (!graph || !graph.files) return;
    if (nodes.length > 0) {
      setNodes((prev) => prev.map((node) => {
        if (node.type === "file") {
          const file = graph.files[node.id];
          return file ? { ...node, data: { label: getFileLabel(file) } } : node;
        }
        if (node.type === "function") {
          const fn = graph.functions[node.id];
          return fn ? { ...node, data: { label: getNodeLabel(fn) } } : node;
        }
        if (node.type === "folder") {
          const folder = folderNodes.find((item) => item.id === node.id);
          return folder ? { ...node, data: { label: getFolderLabel(folder) } } : node;
        }
        return node;
      }));
      return;
    }

    const baseNodes: GraphNode[] = folderNodes.map((folder) => ({
      id: folder.id,
      type: "folder",
      position: { x: 0, y: 0 },
      data: { label: getFolderLabel(folder) },
      style: { border: '2px solid #6366f1', borderRadius: '8px', background: '#eef2ff' }
    }));

    setNodes(baseNodes);
    setEdges([]);
    setDrillState({
      expandedFolders: new Set(),
      expandedFiles: new Set(),
      expandedFunctions: new Set(),
      expandedIncoming: new Set()
    });
  }, [fileNodes, folderNodes, graph, nodes.length]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const layout = layoutGraph(nodes, edges);
    setNodes(layout.nodes as GraphNode[]);
  }, [edges]);

  const displayNodes = useMemo(() => {
    if (!focusMode || !selectedNodeId) return nodes;
    return nodes.map((node) => {
      const isFocused = focusNodeIds.has(node.id) || node.id === selectedNodeId;
      const isHovered = hoveredNodeId === node.id;
      const isSelected = selectedNodeId === node.id;
      return {
        ...node,
        style: {
          ...node.style,
          opacity: isFocused ? 1 : 0.15,
          borderColor: isSelected ? '#111827' : node.style?.borderColor,
          boxShadow: isHovered ? '0 0 0 2px rgba(59,130,246,0.35)' : node.style?.boxShadow
        }
      };
    });
  }, [focusMode, focusNodeIds, hoveredNodeId, nodes, selectedNodeId]);

  const displayEdges = useMemo(() => {
    if (!focusMode || !selectedNodeId) return edges;
    return edges.map((edge) => {
      const isFocused = focusNodeIds.has(edge.source) && focusNodeIds.has(edge.target);
      const isHovered = edge.source === hoveredNodeId || edge.target === hoveredNodeId;
      return {
        ...edge,
        style: {
          ...(edge.style || {}),
          opacity: isFocused ? 1 : 0.1,
          strokeWidth: isHovered ? 3 : (edge.style as { strokeWidth?: number })?.strokeWidth,
          stroke: isHovered ? '#111827' : (edge.style as { stroke?: string })?.stroke
        }
      };
    });
  }, [edges, focusMode, focusNodeIds, hoveredNodeId, selectedNodeId]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((node) => node.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const selectedMeta = useMemo(() => {
    if (!selectedNodeId || !selectedNode) return null;
    if (selectedNode.type === "folder") {
      const folder = folderNodes.find((item) => item.id === selectedNodeId);
      return folder ? { label: folder.name, count: folder.files.length } : null;
    }
    if (selectedNode.type === "file") {
      const file = graph.files[selectedNodeId];
      return file ? { label: file.path, count: file.functions.length, imports: file.imports.length } : null;
    }
    if (selectedNode.type === "function") {
      const fn = graph.functions[selectedNodeId];
      return fn ? { label: fn.name, count: fn.calls.length, params: fn.params.length } : null;
    }
    return null;
  }, [folderNodes, graph.files, graph.functions, selectedNode, selectedNodeId]);

  return (
    <div style={{ width: '100%', height: '800px', border: '1px solid #ccc', marginTop: '20px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        fitView
        minZoom={0.1}
        onInit={setRfInstance}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
        onNodeMouseLeave={() => setHoveredNodeId(null)}
      >
        <Background gap={20} color="#f1f1f1" />
        <Controls />
        <MiniMap nodeStrokeColor="#999" nodeColor="#ccc" nodeBorderRadius={5} />
      </ReactFlow>
      <div style={{ position: 'absolute', left: 16, top: 16, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ background: '#111827', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px' }}>
          {selectedBreadcrumbs.length > 0 ? selectedBreadcrumbs.join(" / ") : "Select a node"}
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}>
          <div style={{ fontWeight: 600, marginBottom: '6px' }}>Focus Mode</div>
          <button onClick={() => setFocusMode((prev) => !prev)}>
            {focusMode ? "Disable Focus" : "Enable Focus"}
          </button>
          <button
            style={{ marginLeft: '8px' }}
            onClick={() => {
              if (rfInstance && selectedNodeId) {
                rfInstance.fitView({ nodes: displayNodes.filter((node) => node.id === selectedNodeId) });
              }
            }}
          >
            Zoom to Selection
          </button>
        </div>
      </div>
      {selectedNode && (
        <div style={{ position: 'absolute', right: 16, top: 16, width: '280px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px', fontSize: '12px' }}>
          <div style={{ fontWeight: 700, marginBottom: '6px' }}>Selected Node</div>
          <div style={{ color: '#6b7280', marginBottom: '6px' }}>{selectedNode.type.toUpperCase()}</div>
          {selectedMeta && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 600 }}>{selectedMeta.label}</div>
              {selectedNode.type === "folder" && <div>Files: {selectedMeta.count}</div>}
              {selectedNode.type === "file" && (
                <div>Functions: {selectedMeta.count} • Imports: {selectedMeta.imports}</div>
              )}
              {selectedNode.type === "function" && (
                <div>Params: {selectedMeta.params} • Calls: {selectedMeta.count}</div>
              )}
            </div>
          )}
          <button
            onClick={() => collapseNode(selectedNode.id, selectedNode.type)}
            style={{ marginTop: '6px' }}
          >
            Collapse
          </button>
          {hoveredNodeId && <div style={{ marginTop: '6px', color: '#6b7280' }}>Hovering: {hoveredNodeId}</div>}
        </div>
      )}
      {loadingNodeId && (
        <div style={{ position: 'absolute', right: 20, top: 20, background: '#111827', color: '#fff', padding: '6px 10px', borderRadius: '6px' }}>
          Loading...
        </div>
      )}
    </div>
  );
};
