"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
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
import { useComposerStore } from "@/lib/store";
import { PipelineNode as PipelineNodeType, PipelineEdge as PipelineEdgeType } from "@/types";
import { nanoid } from "nanoid";

const nodeTypes = { wireAction: PipelineNode, trigger: PipelineNode, condition: PipelineNode, output: PipelineNode };
const edgeTypes = { dataFlow: PipelineEdge };

function toFlowNode(node: PipelineNodeType): Node {
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
      inputFields: [],
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
  const flowInstance = useRef<ReactFlowInstance | null>(null);

  const initialNodes = useMemo(
    () => (pipeline?.nodes || []).map(toFlowNode),
    [pipeline?.nodes]
  );
  const initialEdges = useMemo(
    () => (pipeline?.edges || []).map(toFlowEdge),
    [pipeline?.edges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync from store to flow state when pipeline changes
  useEffect(() => {
    setNodes((pipeline?.nodes || []).map(toFlowNode));
    setEdges((pipeline?.edges || []).map(toFlowEdge));
    setTimeout(() => {
      flowInstance.current?.fitView({ padding: 0.3, duration: 400 });
    }, 100);
  }, [pipeline?.nodes, pipeline?.edges, setNodes, setEdges]);

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

  const onInit = useCallback((instance: ReactFlowInstance) => {
    flowInstance.current = instance;
  }, []);

  return (
    <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onInit={onInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        className="bg-bg-base"
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.04)" />
        <Controls className="[&>button]:bg-bg-surface [&>button]:border-border-default [&>button]:text-text-secondary [&>button]:fill-text-secondary hover:[&>button]:bg-bg-elevated" />
        <MiniMap
          nodeColor="#111122"
          maskColor="rgba(10,10,15,0.8)"
          style={{ backgroundColor: "#0d0d14" }}
        />
      </ReactFlow>
    </ReactFlowProvider>
  );
}
