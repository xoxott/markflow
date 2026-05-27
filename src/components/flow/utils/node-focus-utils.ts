/** 节点键盘焦点导航工具 */

import type { FlowNode } from '../types/flow-node';

export type NodeFocusDirection = 'up' | 'down' | 'left' | 'right';

function nodeCenter(node: FlowNode): { x: number; y: number } {
  const w = node.size?.width ?? 220;
  const h = node.size?.height ?? 72;
  return {
    x: node.position.x + w / 2,
    y: node.position.y + h / 2
  };
}

/** 沿方向查找下一个可聚焦节点（基于画布坐标最近邻） */
export function findNextNodeInDirection(
  nodes: FlowNode[],
  currentId: string | null,
  direction: NodeFocusDirection
): string | null {
  if (nodes.length === 0) return null;
  if (!currentId) return nodes[0]?.id ?? null;

  const current = nodes.find(n => n.id === currentId);
  if (!current) return nodes[0]?.id ?? null;

  const { x: cx, y: cy } = nodeCenter(current);
  let best: FlowNode | null = null;
  let bestScore = Infinity;

  for (const node of nodes) {
    if (node.id === currentId) continue;
    const { x: nx, y: ny } = nodeCenter(node);
    const dx = nx - cx;
    const dy = ny - cy;

    const inDirection =
      (direction === 'right' && dx > 0) ||
      (direction === 'left' && dx < 0) ||
      (direction === 'down' && dy > 0) ||
      (direction === 'up' && dy < 0);

    if (!inDirection) continue;

    const primary = direction === 'left' || direction === 'right' ? Math.abs(dx) : Math.abs(dy);
    const secondary = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
    const score = primary + secondary * 0.5;

    if (score < bestScore) {
      bestScore = score;
      best = node;
    }
  }

  return best?.id ?? null;
}

/** 将焦点移到指定节点的可聚焦根元素 */
export function focusFlowNodeElement(
  canvasEl: HTMLElement | null | undefined,
  nodeId: string
): void {
  if (!canvasEl) return;
  const el = canvasEl.querySelector(
    `[data-node-id="${CSS.escape(nodeId)}"] .flow-node`
  ) as HTMLElement | null;
  el?.focus({ preventScroll: true });
}
