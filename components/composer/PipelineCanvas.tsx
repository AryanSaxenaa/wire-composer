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
  const runStatus = useComposerStore((s) => s.runStatus);
  const updateNode = useComposerStore((s) => s.updateNode);
  const addEdgeToStore = useComposerStore((s) => s.addEdge);
  const removeNode = useComposerStore((s) => s.removeNode);
  const removeEdge = useComposerStore((s) => s.removeEdge);
  const flowInstance = useRef<ReactFlowInstance | null>(null);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);

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
  const prevNodeIds = useRef("");
  const prevNodeCount = useRef(0);
  useEffect(() => {
    const storeNodes = (pipeline?.nodes || []).map(toFlowNode);
    const storeEdges = (pipeline?.edges || []).map(toFlowEdge);

    setNodes(storeNodes);
    setEdges(storeEdges);

    // Only fitView when the node set actually changes (not on status updates during execution)
    const currentIds = storeNodes.map((n) => n.id).sort().join(",");
    if (currentIds !== prevNodeIds.current) {
      prevNodeIds.current = currentIds;

      // §6.3: Stagger-in animation for newly parsed nodes
      if (storeNodes.length > 0 && storeNodes.length !== prevNodeCount.current) {
        prevNodeCount.current = storeNodes.length;
        setTimeout(() => {
          const allNodeEls = document.querySelectorAll(".react-flow__node");
          allNodeEls.forEach((el, i) => {
            (el as HTMLElement).style.animation = `stagger-in 0.3s ease-out ${i * 0.15}s both`;
          });
        }, 50);
      }

      setTimeout(() => {
        flowInstance.current?.fitView({ padding: 0.3, duration: 400 });
      }, 150);
    }
  }, [pipeline?.nodes, pipeline?.edges, setNodes, setEdges]);

  // §6.3: Success flash
  useEffect(() => {
    if (runStatus === "complete") {
      setShowSuccessFlash(true);
      const timer = setTimeout(() => setShowSuccessFlash(false), 900);
      return () => clearTimeout(timer);
    }
  }, [runStatus]);

  // §6.3: Dim nodes that aren't running during pipeline execution
  const isRunning = runStatus === "running";
  useEffect(() => {
    if (isRunning) {
      const allNodeEls = document.querySelectorAll(".react-flow__node");
      allNodeEls.forEach((el) => {
        const inner = el.querySelector(".pipeline-node");
        const status = inner?.getAttribute("data-status");
        if (status !== "running") {
          el.classList.add("dimmed");
        } else {
          el.classList.remove("dimmed");
        }
      });
    } else {
      document.querySelectorAll(".react-flow__node.dimmed").forEach((el) => {
        el.classList.remove("dimmed");
      });
    }
  }, [isRunning, nodes]);

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
      {showSuccessFlash && <div className="canvas-success-flash" />}
      {contextMenu && (
        <NodeContextMenu
          nodeId={contextMenu.nodeId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </ReactFlowProvider>
  );
}
