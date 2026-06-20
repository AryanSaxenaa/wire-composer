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
  NodeChange,
  EdgeChange,
  BackgroundVariant,
  ReactFlowProvider,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { PipelineNode } from "@/components/composer/PipelineNode";
import { PipelineEdge } from "@/components/composer/PipelineEdge";
import { NodeContextMenu } from "@/components/composer/NodeContextMenu";
import { PipelineCanvasEmpty } from "@/components/composer/PipelineCanvasEmpty";
import { useComposerStore } from "@/lib/store";
import { getActionById } from "@/lib/action-registry";
import { PipelineNode as PipelineNodeType, PipelineEdge as PipelineEdgeType } from "@/types";
import { nanoid } from "nanoid";
import { inferDataMappingForEdge } from "@/lib/infer-edge-mapping";

const nodeTypes = {
  wireAction: PipelineNode,
  trigger: PipelineNode,
  condition: PipelineNode,
  output: PipelineNode,
};
const edgeTypes = { dataFlow: PipelineEdge };

function inputPreviewForNode(
  node: PipelineNodeType,
  edges: PipelineEdgeType[],
  nodes: PipelineNodeType[]
): Record<string, string> {
  const action = getActionById(node.actionId);
  const previews: Record<string, string> = {};
  for (const field of (action?.inputFields ?? []).slice(0, 2)) {
    const val = node.config?.[field.key];
    if (val) {
      previews[field.key] = String(val);
      continue;
    }
    const edge = edges.find(
      (e) =>
        e.target === node.id && e.dataMapping.some((m) => m.toField === field.key)
    );
    if (edge) {
      const source = nodes.find((n) => n.id === edge.source);
      previews[field.key] = `← ${source?.label || "upstream"}`;
    }
  }
  return previews;
}

function toFlowNode(
  node: PipelineNodeType,
  stepIndex: number,
  edges: PipelineEdgeType[],
  allNodes: PipelineNodeType[]
): Node {
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
      inputPreviews: inputPreviewForNode(node, edges, allNodes),
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
    // Nodes expose a single in/out handle; field wiring lives in dataMapping only.
    animated: edge.animated,
    type: "dataFlow",
  };
}

export function PipelineCanvas() {
  const pipeline = useComposerStore((s) => s.pipeline);
  const runStatus = useComposerStore((s) => s.runStatus);
  const runContext = useComposerStore((s) => s.runContext);
  const runningNodeId = runContext?.currentNodeId ?? null;
  const updateNode = useComposerStore((s) => s.updateNode);
  const setSelectedNodeId = useComposerStore((s) => s.setSelectedNodeId);
  const setInspectorOpen = useComposerStore((s) => s.setInspectorOpen);
  const addEdgeToStore = useComposerStore((s) => s.addEdge);
  const removeNode = useComposerStore((s) => s.removeNode);
  const removeEdge = useComposerStore((s) => s.removeEdge);
  const flowInstance = useRef<ReactFlowInstance | null>(null);
  const [contextMenu, setContextMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const openConfirm = useComposerStore((s) => s.openConfirm);
  const runStatusForDelete = useComposerStore((s) => s.runStatus);

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
        toFlowNode(
          n,
          stepIndexMap.get(n.id) || 1,
          pipeline?.edges || [],
          pipeline?.nodes || []
        )
      ),
    [pipeline?.nodes, pipeline?.edges, stepIndexMap]
  );
  const initialEdges = useMemo(
    () => (pipeline?.edges || []).map(toFlowEdge),
    [pipeline?.edges]
  );

  const [nodes, setNodes, onNodesChangeInner] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInner] = useEdgesState(initialEdges);
  const [successFlash, setSuccessFlash] = useState(false);

  const prevNodeIds = useRef("");
  const staggerApplied = useRef(false);

  useEffect(() => {
    const storeNodes = (pipeline?.nodes || []).map((n) =>
      toFlowNode(
        n,
        stepIndexMap.get(n.id) || 1,
        pipeline?.edges || [],
        pipeline?.nodes || []
      )
    );
    const storeEdges = (pipeline?.edges || []).map(toFlowEdge);

    setNodes(storeNodes);
    setEdges(storeEdges);

    const currentIds = storeNodes.map((n) => n.id).sort().join(",");
    if (currentIds !== prevNodeIds.current) {
      prevNodeIds.current = currentIds;
      staggerApplied.current = false;
      setTimeout(() => {
        flowInstance.current?.fitView({ padding: 0.35, duration: 400 });
      }, 150);
    }

    if (!staggerApplied.current && storeNodes.length > 0) {
      staggerApplied.current = true;
      setNodes(
        storeNodes.map((n, i) => ({
          ...n,
          className: "animate-stagger-in",
          style: { animationDelay: `${i * 150}ms` },
        }))
      );
    }
  }, [pipeline?.nodes, pipeline?.edges, stepIndexMap, setNodes, setEdges]);

  useEffect(() => {
    if (runStatus !== "complete") return;
    setSuccessFlash(true);
    const t = setTimeout(() => setSuccessFlash(false), 800);
    return () => clearTimeout(t);
  }, [runStatus]);

  useEffect(() => {
    const dim = runStatus === "running" && runningNodeId;
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        className: dim && n.id !== runningNodeId ? "dimmed" : n.className?.replace(" dimmed", ""),
      }))
    );
  }, [runStatus, runningNodeId, setNodes]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = pipeline?.nodes.find((n) => n.id === connection.source);
      const targetNode = pipeline?.nodes.find((n) => n.id === connection.target);
      const dataMapping =
        sourceNode && targetNode
          ? inferDataMappingForEdge(sourceNode, targetNode)
          : [];

      const newEdge: Edge = {
        id: nanoid(),
        source: connection.source!,
        target: connection.target!,
        animated: false,
        type: "dataFlow",
      };
      setEdges((eds) => addEdge(newEdge, eds));
      addEdgeToStore({
        id: newEdge.id,
        source: newEdge.source,
        target: newEdge.target,
        sourceHandle: connection.sourceHandle || "default",
        targetHandle: connection.targetHandle || "default",
        dataMapping,
        animated: false,
      });

      if (typeof pendo !== "undefined") {
        pendo.track("pipeline_edge_created", {
          pipelineId: pipeline?.id,
          sourceNodeId: connection.source,
          targetNodeId: connection.target,
          sourceActionId: sourceNode?.actionId,
          targetActionId: targetNode?.actionId,
          dataMappingCount: dataMapping.length,
        });
      }
    },
    [setEdges, addEdgeToStore, pipeline?.nodes]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updateNode(node.id, { position: node.position });
    },
    [updateNode]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (runStatusForDelete === "running") return;
      const removals = changes.filter((c) => c.type === "remove");
      const rest = changes.filter((c) => c.type !== "remove");
      if (rest.length) onNodesChangeInner(rest);
      if (removals.length) {
        openConfirm({
          title: "Remove step?",
          message: `Remove ${removals.length} node${removals.length === 1 ? "" : "s"} from the pipeline?`,
          confirmLabel: "Remove",
          variant: "danger",
          onConfirm: () => onNodesChangeInner(removals),
        });
      }
    },
    [onNodesChangeInner, openConfirm, runStatusForDelete]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (runStatusForDelete === "running") return;
      const removals = changes.filter((c) => c.type === "remove");
      const rest = changes.filter((c) => c.type !== "remove");
      if (rest.length) onEdgesChangeInner(rest);
      if (removals.length) {
        openConfirm({
          title: "Remove connection?",
          message: `Remove ${removals.length} connection${removals.length === 1 ? "" : "s"}?`,
          confirmLabel: "Remove",
          variant: "danger",
          onConfirm: () => onEdgesChangeInner(removals),
        });
      }
    },
    [onEdgesChangeInner, openConfirm, runStatusForDelete]
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

  const isEmpty = !pipeline || pipeline.nodes.length === 0;

  return (
    <div className="cmp-canvas-wrap">
      {isEmpty && <PipelineCanvasEmpty />}
      <ReactFlowProvider>
        <ReactFlow
          className={isEmpty ? "cmp-flow--empty" : undefined}
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
          onPaneClick={() => {
            setContextMenu(null);
            setSelectedNodeId(null);
            setInspectorOpen(false);
          }}
          onNodeClick={(_e, node) => {
            setSelectedNodeId(node.id);
            setInspectorOpen(true);
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          deleteKeyCode={["Backspace", "Delete"]}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#cbd5e1" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor="#2563eb"
            maskColor="rgba(255, 255, 255, 0.85)"
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
      {successFlash && <div className="canvas-success-flash" aria-hidden />}
    </div>
  );
}
