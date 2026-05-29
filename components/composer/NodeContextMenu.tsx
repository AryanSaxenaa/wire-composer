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
    onClose();
  };

  const handleRemove = () => {
    removeNode(nodeId);
    onClose();
  };

  const handleDuplicate = () => {
    const node = pipeline?.nodes.find((n) => n.id === nodeId);
    if (!node) { onClose(); return; }
    addNode({
      ...node,
      id: nanoid(),
      position: { x: node.position.x + 50, y: node.position.y + 50 },
    });
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] py-1 min-w-[140px] bg-bg-elevated border border-border-default rounded-md shadow-lg"
      style={{ left: x, top: y }}
    >
      <button
        onClick={handleEdit}
        className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-bg-subtle font-mono"
      >
        Edit
      </button>
      <button
        onClick={handleDuplicate}
        className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-bg-subtle font-mono"
      >
        Duplicate
      </button>
      <div className="border-t border-border-default my-1" />
      <button
        onClick={handleRemove}
        className="w-full text-left px-3 py-1.5 text-xs text-error hover:bg-bg-subtle font-mono"
      >
        Remove
      </button>
    </div>
  );
}
