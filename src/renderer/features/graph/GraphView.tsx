import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls, 
  MiniMap,
  ReactFlowInstance
} from "reactflow";

import { BreadcrumbNav } from "../../components/BreadcrumbNav";
import { FileNodeComponent, FolderNodeComponent, FunctionNodeComponent } from "./components/GraphNodeComponents";
import { EDGE_STYLE } from "./lib/edgeStyles";
import { buildFolderMap } from "./lib/folderTree";
import { layoutGraph } from "./lib/layoutGraph";
import { BreadcrumbItem, CodeGraph, DrillState, FunctionNode, GraphNode, NodeKind } from "./types/graphTypes";

const NODE_TYPES = {
  folder: FolderNodeComponent,
  file: FileNodeComponent,
  function: FunctionNodeComponent
};

const addEdgeIfMissing = (edges: Edge[], edge: Edge) => {
  if (!edges.some((item) => item.id === edge.id)) {
    edges.push(edge);
  }
};

const addNodeIfMissing = (nodes: GraphNode[], node: GraphNode) => {
  if (!nodes.some((item) => item.id === node.id)) {
    nodes.push(node);
  }
};

export const GraphView = ({ graph, onNodeSelect }: { graph: CodeGraph; onNodeSelect?: (node: any) => void }) => {
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

  const getNodeType = useCallback((nodeId: string): NodeKind => {
    if (nodeId.startsWith("folder:")) return "folder";
    if (graph.files[nodeId]) return "file";
    return "function";
  }, [graph.files]);

  const getNodeLabel = useCallback((nodeId: string) => {
    if (nodeId.startsWith("folder:")) {
      const folder = folderNodes.find((item) => item.id === nodeId);
      return folder?.name || nodeId.replace("folder:", "").split("/").pop() || "Folder";
    }

    const file = graph.files[nodeId];
    if (file) {
      return file.path.split(/[\\/]/).pop() || file.path;
    }

    const fn = graph.functions[nodeId];
    if (fn) {
      return `${fn.name}()`;
    }

    return nodeId.split(/[\\/]/).pop() || nodeId;
  }, [folderNodes, graph.files, graph.functions]);

  const getParentBreadcrumb = useCallback((nodeId: string) => {
    const breadcrumbs: string[] = [];
    let currentId: string | undefined = nodeId;
    const parents = parentMapRef.current;

    let safety = 0;
    while (currentId && safety < 50) {
      breadcrumbs.unshift(currentId);
      const parentSet = parents.get(currentId);
      const parent = parentSet ? Array.from(parentSet.values())[0] : undefined;
      
      // Prevent recursion loops
      if (parent === currentId) break;
      
      currentId = parent;
      safety++;
    }
    return breadcrumbs;
  }, []);

  const selectedBreadcrumbs = useMemo(() => {
    if (!selectedNodeId) return [];
    const ids = getParentBreadcrumb(selectedNodeId);
    return ids.map((id) => ({
      id,
      label: getNodeLabel(id),
      type: getNodeType(id)
    }));
  }, [getNodeLabel, getNodeType, getParentBreadcrumb, selectedNodeId]);


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

  const applyLayout = useCallback((newNodes: GraphNode[], newEdges: Edge[]) => {
    const layout = layoutGraph(newNodes, newEdges);
    setNodes(layout.nodes as GraphNode[]);
    setEdges(layout.edges);
    if (rfInstance) {
      setTimeout(() => rfInstance.fitView(), 50);
    }
  }, [rfInstance]);

  const getDescendantIds = useCallback((rootId: string) => {
    const childMap = childMapRef.current;
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

    return toRemove;
  }, []);

  const cleanupDetachedRelationships = useCallback((toRemove: Set<string>) => {
    const childMap = childMapRef.current;
    const parentMap = parentMapRef.current;

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
    const toRemove = getDescendantIds(nodeId);
    const nextNodes = nodes.filter((node) => !toRemove.has(node.id));
    const nextEdges = edges.filter((edge) => !toRemove.has(edge.source) && !toRemove.has(edge.target));

    cleanupDetachedRelationships(toRemove);
    applyLayout(nextNodes, nextEdges);

    if (selectedNodeId && toRemove.has(selectedNodeId)) {
      setSelectedNodeId(nodeId);
      const node = nextNodes.find((item) => item.id === nodeId);
      if (node) onNodeSelect?.(node);
    }

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
  }, [applyLayout, cleanupDetachedRelationships, edges, getDescendantIds, nodes, onNodeSelect, selectedNodeId]);

  const focusNode = useCallback((nodeId: string) => {
    if (!rfInstance) return;

    setTimeout(() => {
      rfInstance.fitView({
        nodes: [{ id: nodeId }],
        padding: 0.65,
        duration: 700
      });
    }, 80);
  }, [rfInstance]);

  const selectGraphNode = useCallback((node: GraphNode | Node) => {
    setSelectedNodeId(node.id);
    onNodeSelect?.(node);
    document.dispatchEvent(new CustomEvent("graph-select", { detail: node.id }));
    focusNode(node.id);
  }, [focusNode, onNodeSelect]);

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

    const pendingNodes = [...nodes];
    const pendingEdges = [...edges];

    folder.childFolders.forEach((childId) => {
      const childFolder = folderNodes.find((f) => f.id === childId);
      if (!childFolder) return;

      if (!pendingNodes.some(n => n.id === childFolder.id)) {
        pendingNodes.push({
          id: childFolder.id,
          type: "folder",
          position: { x: 0, y: 0 },
          data: { label: childFolder.name, foldersCount: childFolder.childFolders.length, filesCount: childFolder.files.length },
        });
      }

      addEdgeIfMissing(pendingEdges, {
        id: `e-folder-${folderId}-${childId}`,
        source: folderId,
        target: childId,
        type: "smoothstep",
        animated: false,
        style: EDGE_STYLE.hierarchy,
      });

      linkNodes(folderId, childId);
    });

    folder.files.forEach((fileId) => {
      const file = graph.files[fileId];
      if (!file) return;

      const pathSegments = file.path.split(/[\\/]/);

      if (!pendingNodes.some(n => n.id === file.id)) {
        pendingNodes.push({
          id: file.id,
          type: "file",
          position: { x: 0, y: 0 },
          data: { name: pathSegments.pop(), parentPath: pathSegments.slice(-2).join('/'), importsCount: file.imports.length, functionsCount: file.functions.length },
        });
      }

      addEdgeIfMissing(pendingEdges, {
        id: `e-folder-${folderId}-${file.id}`,
        source: folderId,
        target: file.id,
        type: "smoothstep",
        animated: false,
        style: EDGE_STYLE.hierarchy,
        markerEnd: { type: EDGE_STYLE.arrow, color: 'rgba(0, 200, 255, 0.4)' }
      });

      linkNodes(folderId, file.id);
    });

    setDrillState((prev) => ({
      ...prev,
      expandedFolders: new Set(prev.expandedFolders).add(folderId)
    }));
    setLoadingNodeId(null);
    applyLayout(pendingNodes, pendingEdges);
  }, [collapseNode, drillState.expandedFolders, folderNodes, graph.files, linkNodes, applyLayout, nodes, edges]);

  const expandFile = useCallback(async (fileId: string) => {
    if (drillState.expandedFiles.has(fileId)) {
      collapseNode(fileId, "file");
      return;
    }
    setLoadingNodeId(fileId);
    const functions: FunctionNode[] = await window.api.getFunctionsByFile(fileId);
    const pendingNodes = [...nodes];
    const pendingEdges = [...edges];

    functions.forEach((fn: FunctionNode) => {
      if (!pendingNodes.some(n => n.id === fn.id)) {
        pendingNodes.push({
          id: fn.id,
          type: "function",
          position: { x: 0, y: 0 },
          data: { name: fn.name || 'anonymous', paramsCount: fn.params.length, callsCount: fn.calls.length },
        });
      }

      addEdgeIfMissing(pendingEdges, {
        id: `e-file-${fileId}-${fn.id}`,
        source: fileId,
        target: fn.id,
        type: "smoothstep",
        animated: true,
        style: EDGE_STYLE.file,
        markerEnd: { type: EDGE_STYLE.arrow, color: 'rgba(0, 255, 120, 0.4)' }
      });

      linkNodes(fileId, fn.id);
    });

    setDrillState((prev) => ({
      ...prev,
      expandedFiles: new Set(prev.expandedFiles).add(fileId)
    }));
    setLoadingNodeId(null);
    applyLayout(pendingNodes, pendingEdges);
  }, [drillState.expandedFiles, applyLayout, nodes, edges, linkNodes, collapseNode]);

  const expandFunctionCalls = useCallback(async (functionId: string) => {
    if (drillState.expandedFunctions.has(functionId)) {
      collapseNode(functionId, "function");
      return;
    }
    setLoadingNodeId(functionId);
    const targets: FunctionNode[] = await window.api.getFunctionCalls(functionId);
    const pendingNodes = [...nodes];
    const pendingEdges = [...edges];

    targets.forEach((fn: FunctionNode) => {
      if (!pendingNodes.some(n => n.id === fn.id)) {
        pendingNodes.push({
          id: fn.id,
          type: "function",
          position: { x: 0, y: 0 },
          data: { name: fn.name || 'anonymous', paramsCount: fn.params.length, callsCount: fn.calls.length },
        });
      }

      addEdgeIfMissing(pendingEdges, {
        id: `e-call-${functionId}-${fn.id}`,
        source: functionId,
        target: fn.id,
        type: "smoothstep",
        animated: true,
        style: EDGE_STYLE.call,
        markerEnd: { type: EDGE_STYLE.arrow, color: 'rgba(180, 80, 255, 0.6)' }
      });

      linkNodes(functionId, fn.id);
    });

    setDrillState((prev) => ({
      ...prev,
      expandedFunctions: new Set(prev.expandedFunctions).add(functionId)
    }));
    setLoadingNodeId(null);
    applyLayout(pendingNodes, pendingEdges);
  }, [drillState.expandedFunctions, applyLayout, nodes, edges, linkNodes, collapseNode]);

  const expandIncomingCalls = useCallback(async (functionId: string) => {
    if (drillState.expandedIncoming.has(functionId)) {
      collapseNode(functionId, "function");
      return;
    }
    setLoadingNodeId(functionId);
    const callers: FunctionNode[] = await window.api.getIncomingCalls(functionId);
    const pendingNodes = [...nodes];
    const pendingEdges = [...edges];

    callers.forEach((fn: FunctionNode) => {
      if (!pendingNodes.some(n => n.id === fn.id)) {
        pendingNodes.push({
          id: fn.id,
          type: "function",
          position: { x: 0, y: 0 },
          data: { name: fn.name || 'anonymous', paramsCount: fn.params.length, callsCount: fn.calls.length },
        });
      }

      addEdgeIfMissing(pendingEdges, {
        id: `e-incoming-${fn.id}-${functionId}`,
        source: fn.id,
        target: functionId,
        type: "smoothstep",
        animated: true,
        style: EDGE_STYLE.incoming,
        markerEnd: { type: EDGE_STYLE.arrow, color: 'rgba(180, 80, 255, 0.6)' }
      });

      linkNodes(functionId, fn.id);
    });

    setDrillState((prev) => ({
      ...prev,
      expandedIncoming: new Set(prev.expandedIncoming).add(functionId)
    }));
    setLoadingNodeId(null);
    applyLayout(pendingNodes, pendingEdges);
  }, [drillState.expandedIncoming, applyLayout, nodes, edges, linkNodes, collapseNode]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (event.detail > 1) return; // Ignore double-click events, let onNodeDoubleClick handle it
    selectGraphNode(node);
    if (node.type === "folder") {
      expandFolder(node.id);
    } else if (node.type === "file") {
      expandFile(node.id);
    } else if (node.type === "function") {
      expandFunctionCalls(node.id);
    }
  }, [expandFile, expandFolder, expandFunctionCalls, selectGraphNode]);

  const handleNodeDoubleClick = useCallback((_: unknown, node: Node) => {
    if (node.type === "function") {
      expandIncomingCalls(node.id);
    }
  }, [expandIncomingCalls]);

  useEffect(() => {
    if (!graph || !graph.files || Object.keys(graph.files).length === 0) return;
    if (nodes.length > 0) {
      const nextNodes = nodes.map((node) => {
        if (node.type === "file") {
          const file = graph.files[node.id];
          const pathSegments = file ? file.path.split(/[\\/]/) : [];
          return file ? { ...node, data: { name: pathSegments.pop(), parentPath: pathSegments.slice(-2).join('/'), importsCount: file.imports.length, functionsCount: file.functions.length } } : node;
        }
        if (node.type === "function") {
          const fn = graph.functions[node.id];
          return fn ? { ...node, data: { name: fn.name || 'anonymous', paramsCount: fn.params.length, callsCount: fn.calls.length } } : node;
        }
        if (node.type === "folder") {
          const folder = folderNodes.find((item) => item.id === node.id);
          return folder ? { ...node, data: { label: folder.name, foldersCount: folder.childFolders.length, filesCount: folder.files.length } } : node;
        }
        return node;
      }).filter((node) => {
        if (node.type === "folder") {
          return folderNodes.some((folder) => folder.id === node.id);
        }
        if (node.type === "file") {
          return Boolean(graph.files[node.id]);
        }
        return Boolean(graph.functions[node.id]);
      });

      const nextNodeIds = new Set(nextNodes.map((node) => node.id));
      const nextEdges = edges.filter((edge) => {
        if (!nextNodeIds.has(edge.source) || !nextNodeIds.has(edge.target)) return false;

        if (edge.id.startsWith("e-file-")) {
          return graph.files[edge.source]?.functions.includes(edge.target);
        }

        if (edge.id.startsWith("e-call-") || edge.id.startsWith("e-incoming-")) {
          return graph.functions[edge.source]?.calls.includes(edge.target);
        }

        if (edge.id.startsWith("e-folder-")) {
          const folder = folderNodes.find((item) => item.id === edge.source);
          return Boolean(folder?.childFolders.includes(edge.target) || folder?.files.includes(edge.target));
        }

        return true;
      });

      drillState.expandedFolders.forEach((folderId) => {
        const folder = folderNodes.find((item) => item.id === folderId);
        if (!folder || !nextNodeIds.has(folderId)) return;

        folder.childFolders.forEach((childId) => {
          const childFolder = folderNodes.find((item) => item.id === childId);
          if (!childFolder) return;

          addNodeIfMissing(nextNodes, {
            id: childFolder.id,
            type: "folder",
            position: { x: 0, y: 0 },
            data: { label: childFolder.name, foldersCount: childFolder.childFolders.length, filesCount: childFolder.files.length },
          });
          nextNodeIds.add(childFolder.id);
          addEdgeIfMissing(nextEdges, {
            id: `e-folder-${folderId}-${childId}`,
            source: folderId,
            target: childId,
            type: "smoothstep",
            animated: false,
            style: EDGE_STYLE.hierarchy
          });
          linkNodes(folderId, childId);
        });

        folder.files.forEach((fileId) => {
          const file = graph.files[fileId];
          if (!file) return;

          const pathSegments = file.path.split(/[\\/]/);
          addNodeIfMissing(nextNodes, {
            id: file.id,
            type: "file",
            position: { x: 0, y: 0 },
            data: { name: pathSegments.pop(), parentPath: pathSegments.slice(-2).join("/"), importsCount: file.imports.length, functionsCount: file.functions.length },
          });
          nextNodeIds.add(file.id);
          addEdgeIfMissing(nextEdges, {
            id: `e-folder-${folderId}-${file.id}`,
            source: folderId,
            target: file.id,
            type: "smoothstep",
            animated: false,
            style: EDGE_STYLE.hierarchy,
            markerEnd: { type: EDGE_STYLE.arrow, color: "rgba(0, 200, 255, 0.4)" }
          });
          linkNodes(folderId, file.id);
        });
      });

      drillState.expandedFiles.forEach((fileId) => {
        const file = graph.files[fileId];
        if (!file || !nextNodeIds.has(fileId)) return;

        file.functions.forEach((fnId) => {
          const fn = graph.functions[fnId];
          if (!fn) return;

          addNodeIfMissing(nextNodes, {
            id: fn.id,
            type: "function",
            position: { x: 0, y: 0 },
            data: { name: fn.name || "anonymous", paramsCount: fn.params.length, callsCount: fn.calls.length },
          });
          nextNodeIds.add(fn.id);
          addEdgeIfMissing(nextEdges, {
            id: `e-file-${fileId}-${fn.id}`,
            source: fileId,
            target: fn.id,
            type: "smoothstep",
            animated: true,
            style: EDGE_STYLE.file,
            markerEnd: { type: EDGE_STYLE.arrow, color: "rgba(0, 255, 120, 0.4)" }
          });
          linkNodes(fileId, fn.id);
        });
      });

      drillState.expandedFunctions.forEach((functionId) => {
        const sourceFn = graph.functions[functionId];
        if (!sourceFn || !nextNodeIds.has(functionId)) return;

        sourceFn.calls.forEach((targetId) => {
          const fn = graph.functions[targetId];
          if (!fn) return;

          addNodeIfMissing(nextNodes, {
            id: fn.id,
            type: "function",
            position: { x: 0, y: 0 },
            data: { name: fn.name || "anonymous", paramsCount: fn.params.length, callsCount: fn.calls.length },
          });
          nextNodeIds.add(fn.id);
          addEdgeIfMissing(nextEdges, {
            id: `e-call-${functionId}-${fn.id}`,
            source: functionId,
            target: fn.id,
            type: "smoothstep",
            animated: true,
            style: EDGE_STYLE.call,
            markerEnd: { type: EDGE_STYLE.arrow, color: "rgba(180, 80, 255, 0.6)" }
          });
          linkNodes(functionId, fn.id);
        });
      });

      drillState.expandedIncoming.forEach((functionId) => {
        if (!nextNodeIds.has(functionId)) return;

        Object.values(graph.functions).forEach((fn) => {
          if (!fn.calls.includes(functionId)) return;

          addNodeIfMissing(nextNodes, {
            id: fn.id,
            type: "function",
            position: { x: 0, y: 0 },
            data: { name: fn.name || "anonymous", paramsCount: fn.params.length, callsCount: fn.calls.length },
          });
          nextNodeIds.add(fn.id);
          addEdgeIfMissing(nextEdges, {
            id: `e-incoming-${fn.id}-${functionId}`,
            source: fn.id,
            target: functionId,
            type: "smoothstep",
            animated: true,
            style: EDGE_STYLE.incoming,
            markerEnd: { type: EDGE_STYLE.arrow, color: "rgba(180, 80, 255, 0.6)" }
          });
          linkNodes(functionId, fn.id);
        });
      });

      applyLayout(nextNodes, nextEdges);
      return;
    }

    const rootFolders = folderNodes.filter((f) => !f.parentFolderId);
    const baseNodes: GraphNode[] = rootFolders.map((folder) => ({
      id: folder.id,
      type: "folder",
      position: { x: 0, y: 0 },
      data: { label: folder.name, foldersCount: folder.childFolders.length, filesCount: folder.files.length },
    }));

    applyLayout(baseNodes, []);

    setDrillState({
      expandedFolders: new Set(),
      expandedFiles: new Set(),
      expandedFunctions: new Set(),
      expandedIncoming: new Set()
    });
  }, [applyLayout, drillState, folderNodes, graph, linkNodes, nodes.length]);



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
          opacity: isFocused ? 1 : 0.4,
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
          opacity: isFocused ? 1 : 0.3,
          strokeWidth: isHovered ? 3 : (edge.style as { strokeWidth?: number })?.strokeWidth,
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

  const handleResetView = useCallback(() => {

    if (rfInstance) {
      rfInstance.fitView({ duration: 800 });
    }
  }, [rfInstance]);

  const handleBreadcrumbSelect = useCallback((item: BreadcrumbItem) => {
    const node = nodes.find((current) => current.id === item.id);
    if (!node) return;

    if (item.id !== selectedNodeId) {
      const descendants = getDescendantIds(item.id);
      const nextNodes = nodes.filter((current) => !descendants.has(current.id));
      const nextEdges = edges.filter((edge) => !descendants.has(edge.source) && !descendants.has(edge.target));

      cleanupDetachedRelationships(descendants);
      applyLayout(nextNodes, nextEdges);
    }

    selectGraphNode(node);
  }, [
    applyLayout,
    cleanupDetachedRelationships,
    edges,
    getDescendantIds,
    nodes,
    selectGraphNode,
    selectedNodeId
  ]);

  const handleBack = useCallback(() => {
    const previousCrumb = selectedBreadcrumbs[selectedBreadcrumbs.length - 2];
    if (previousCrumb) {
      handleBreadcrumbSelect(previousCrumb);
    }
  }, [handleBreadcrumbSelect, selectedBreadcrumbs]);

  return (
    <div className="h-full w-full flex flex-col bg-[#050816] z-0 overflow-hidden">


      <div className="z-10">
        <BreadcrumbNav 
          breadcrumbs={selectedBreadcrumbs} 
          onBreadcrumbSelect={handleBreadcrumbSelect}
          onResetView={handleResetView}
          onBack={handleBack}
          onLayoutChange={(layout: string) => {
            console.log("Layout change:", layout);
          }}
        />
      </div>

      
      <div className="flex-1 relative overflow-hidden border-t border-white/5">
        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          nodeTypes={NODE_TYPES}
          fitView
          minZoom={0.01}
          maxZoom={4}
          onInit={setRfInstance}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
        >


          <Background gap={24} color="rgba(255, 255, 255, 0.05)" style={{ backgroundColor: '#050816' }} />
          <Controls className="bg-slate-900/80 backdrop-blur-md border border-slate-700 fill-slate-300" />
          <MiniMap 
            nodeColor="rgba(0, 200, 255, 0.2)" 
            maskColor="rgba(5, 8, 22, 0.8)" 
            style={{ backgroundColor: 'rgba(5, 8, 22, 0.9)', border: '1px solid rgba(0, 200, 255, 0.2)' }} 
          />
        </ReactFlow>

        {loadingNodeId && (
          <div className="absolute right-6 top-6 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded-full backdrop-blur-md animate-pulse">
            UPDATING GRAPH...
          </div>
        )}
      </div>
    </div>
  );
};
