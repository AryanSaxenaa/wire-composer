"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Node,
  Edge,
  BackgroundVariant,
  ReactFlowProvider,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { PipelineNode } from "@/components/composer/PipelineNode";
import { PipelineEdge } from "@/components/composer/PipelineEdge";
import { NodeContextMenu } from "@/components/composer/NodeContextMenu";
import { ComposerStatusCard } from "@/components/composer/ComposerStatusCard";
import { useComposerStore } from "@/lib/store";
import { getActionById } from "@/lib/action-registry";
import { PipelineNode as PipelineNodeType, PipelineEdge as PipelineEdgeType } from "@/types";
import { nanoid } from "nanoid";

const nodeTypes = {
  wireAction: PipelineNode,
  trigger: PipelineNode,
  condition: PipelineNode,
  output: PipelineNode,
};
const edgeTypes = { dataFlow: PipelineEdge };

function toFlowNode(node: PipelineNodeType, stepIndex: number): Node {
  const action = getActionById(node.actionId);
  return {
    id: node.id,
    type: node.type as string,
    position: node.position,
    data: {
      label: node.label,
      platform: node.platform,
      actionId: node.actionId,
      status: node.status,
      config: node.config,
      output: node.output,
      error: node.error,
      stepIndex,
      description: action?.description || "",
    },
  };
}

function toFlowEdge(edge: PipelineEdgeType): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    animated: edge.animated,
    type: "dataFlow",
  };
}

export function PipelineCanvas() {
  const pipeline = useComposerStore((s) => s.pipeline);
  const updateNode = useComposerStore((s) => s.updateNode);
  const addEdgeToStore = useComposerStore((s) => s.addEdge);
  const removeNode = useComposerStore((s) => s.removeNode);
  const removeEdge = useComposerStore((s) => s.removeEdge);
  const flowInstance = useRef<ReactFlowInstance | null>(null);
  const [contextMenu, setContextMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);

  const orderedNodes = useMemo(() => {
    if (!pipeline) return [];
    const edges = pipeline.edges;
    const sorted: PipelineNodeType[] = [];
    const visited = new Set<string>();
    const roots = pipeline.nodes.filter((n) => !edges.some((e) => e.target === n.id));
    const queue = [...roots];
    while (queue.length) {
      const n = queue.shift()!;
      if (visited.has(n.id)) continue;
      visited.add(n.id);
      sorted.push(n);
      edges
        .filter((e) => e.source === n.id)
        .forEach((e) => {
          const child = pipeline.nodes.find((c) => c.id === e.target);
          if (child) queue.push(child);
        });
    }
    pipeline.nodes.forEach((n) => {
      if (!visited.has(n.id)) sorted.push(n);
    });
    return sorted;
  }, [pipeline]);

  const stepIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    orderedNodes.forEach((n, i) => map.set(n.id, i + 1));
    return map;
  }, [orderedNodes]);

  const initialNodes = useMemo(
    () =>
      (pipeline?.nodes || []).map((n) =>
        toFlowNode(n, stepIndexMap.get(n.id) || 1)
      ),
    [pipeline?.nodes, stepIndexMap]
  );
  const initialEdges = useMemo(
    () => (pipeline?.edges || []).map(toFlowEdge),
    [pipeline?.edges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const prevNodeIds = useRef("");

  useEffect(() => {
    const storeNodes = (pipeline?.nodes || []).map((n) =>
      toFlowNode(n, stepIndexMap.get(n.id) || 1)
    );
    const storeEdges = (pipeline?.edges || []).map(toFlowEdge);

    setNodes(storeNodes);
    setEdges(storeEdges);

    const currentIds = storeNodes.map((n) => n.id).sort().join(",");
    if (currentIds !== prevNodeIds.current) {
      prevNodeIds.current = currentIds;
      setTimeout(() => {
        flowInstance.current?.fitView({ padding: 0.35, duration: 400 });
      }, 150);
    }
  }, [pipeline?.nodes, pipeline?.edges, stepIndexMap, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        id: nanoid(),
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle || "",
        targetHandle: connection.targetHandle || "",
        animated: false,
        type: "dataFlow",
      };
      setEdges((eds) => addEdge(newEdge, eds));
      addEdgeToStore({
        id: newEdge.id,
        source: newEdge.source,
        target: newEdge.target,
        sourceHandle: newEdge.sourceHandle || "",
        targetHandle: newEdge.targetHandle || "",
        dataMapping: [],
        animated: false,
      });
    },
    [setEdges, addEdgeToStore]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updateNode(node.id, { position: node.position });
    },
    [updateNode]
  );

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      deleted.forEach((n) => removeNode(n.id));
    },
    [removeNode]
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      deleted.forEach((e) => removeEdge(e.id));
    },
    [removeEdge]
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    flowInstance.current = instance;
  }, []);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
    },
    []
  );

  return (
    <div className="cmp-canvas-wrap">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onInit={onInit}
          onNodeContextMenu={onNodeContextMenu}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          deleteKeyCode={["Backspace", "Delete"]}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#d1d5db" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor="#93c5fd"
            maskColor="rgba(249, 250, 251, 0.85)"
          />
        </ReactFlow>
        {contextMenu && (
          <NodeContextMenu
            nodeId={contextMenu.nodeId}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
          />
        )}
      </ReactFlowProvider>
      <ComposerStatusCard />
    </div>
  );
}
