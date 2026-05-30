import { PipelineNode, PipelineEdge } from "@/types";

/** Left-to-right layout per build spec §5.1 / §17 */
export function autoLayoutNodes(
  nodes: PipelineNode[],
  edges: PipelineEdge[]
): PipelineNode[] {
  const depths = new Map<string, number>();
  const children = new Map<string, string[]>();

  nodes.forEach((n) => depths.set(n.id, -1));
  nodes.forEach((n) => children.set(n.id, []));

  edges.forEach((e) => {
    const c = children.get(e.source);
    if (c) c.push(e.target);
  });

  const roots = nodes.filter((n) => !edges.some((e) => e.target === n.id));
  roots.forEach((r) => depths.set(r.id, 0));

  const queue = [...roots];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDepth = depths.get(current.id)!;
    const kidList = children.get(current.id) || [];
    kidList.forEach((kidId) => {
      const kidDepth = depths.get(kidId);
      if (kidDepth === undefined || kidDepth === -1 || kidDepth < currentDepth + 1) {
        depths.set(kidId, currentDepth + 1);
        const kidNode = nodes.find((n) => n.id === kidId);
        if (kidNode) queue.push(kidNode);
      }
    });
  }

  nodes.forEach((n) => {
    if ((depths.get(n.id) ?? -1) === -1) depths.set(n.id, 0);
  });

  const byDepth = new Map<number, PipelineNode[]>();
  nodes.forEach((n) => {
    const d = depths.get(n.id) ?? 0;
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(n);
  });

  const BASE_X = 100;
  const X_STEP = 280;
  const BASE_Y = 200;
  const SPACING_Y = 130;

  const result: PipelineNode[] = [];
  const sortedDepths = [...byDepth.keys()].sort((a, b) => a - b);

  sortedDepths.forEach((depth) => {
    const layer = byDepth.get(depth)!;
    const totalHeight = Math.max(0, (layer.length - 1) * SPACING_Y);
    const startY = BASE_Y - totalHeight / 2;

    layer.forEach((node, i) => {
      result.push({
        ...node,
        position: {
          x: BASE_X + depth * X_STEP,
          y: startY + i * SPACING_Y,
        },
      });
    });
  });

  return result;
}
