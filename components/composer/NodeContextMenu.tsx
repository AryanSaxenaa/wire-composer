"use client";

import { useEffect, useRef } from "react";
import { useComposerStore } from "@/lib/store";
import { nanoid } from "nanoid";

interface NodeContextMenuProps {
  nodeId: string;
  x: number;
  y: number;
  onClose: () => void;
}

export function NodeContextMenu({ nodeId, x, y, onClose }: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const pipeline = useComposerStore((s) => s.pipeline);
  const removeNode = useComposerStore((s) => s.removeNode);
  const addNode = useComposerStore((s) => s.addNode);
  const setSelectedNodeId = useComposerStore((s) => s.setSelectedNodeId);
  const setInspectorOpen = useComposerStore((s) => s.setInspectorOpen);
  const openConfirm = useComposerStore((s) => s.openConfirm);
  const runStatus = useComposerStore((s) => s.runStatus);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  const handleEdit = () => {
    setSelectedNodeId(nodeId);
    setInspectorOpen(true);
    onClose();
  };

  const handleRemove = () => {
    if (runStatus === "running") {
      onClose();
      return;
    }
    openConfirm({
      title: "Remove step?",
      message: "This removes the node and its connections.",
      confirmLabel: "Remove",
      variant: "danger",
      onConfirm: () => removeNode(nodeId),
    });
    onClose();
  };

  const handleDuplicate = () => {
    const node = pipeline?.nodes.find((n) => n.id === nodeId);
    if (!node) {
      onClose();
      return;
    }
    addNode({
      ...node,
      id: nanoid(),
      position: { x: node.position.x + 48, y: node.position.y + 48 },
      status: "idle",
      output: undefined,
      error: undefined,
    });

    if (typeof pendo !== "undefined") {
      pendo.track("pipeline_node_duplicated", {
        pipelineId: pipeline?.id,
        sourceNodeId: node.id,
        actionId: node.actionId,
        platform: node.platform,
        nodeLabel: (node.label || "").substring(0, 50),
      });
    }

    onClose();
  };

  return (
    <div ref={menuRef} className="cmp-context-menu" style={{ left: x, top: y }}>
      <button type="button" onClick={handleEdit}>
        Edit
      </button>
      <button type="button" onClick={handleDuplicate}>
        Duplicate
      </button>
      <hr />
      <button type="button" className="cmp-context-menu--danger" onClick={handleRemove}>
        Remove
      </button>
    </div>
  );
}
