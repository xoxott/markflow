/** Flow vs Vue-Flow 基准测试共享数据 */

import type { Edge, Node } from '@vue-flow/core';
import type { FlowEdge, FlowNode } from '../types';

const DEFAULT_NODE_WIDTH = 220;
const DEFAULT_NODE_HEIGHT = 72;

/** 固定种子，保证 Flow / Vue-Flow 使用相同布局 */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateFlowNodes(count: number, seed = 42): FlowNode[] {
  const random = seededRandom(seed);
  return Array.from({ length: count }, (_, i) => ({
    id: `node-${i}`,
    type: 'default',
    position: {
      x: random() * 10000,
      y: random() * 10000
    },
    size: { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
    data: { label: `Node ${i}` }
  }));
}

export function generateFlowEdges(nodeCount: number, edgeCount: number, seed = 43): FlowEdge[] {
  const random = seededRandom(seed);
  const edges: FlowEdge[] = [];
  for (let i = 0; i < edgeCount; i += 1) {
    const source = Math.floor(random() * nodeCount);
    let target = Math.floor(random() * nodeCount);
    if (target === source) {
      target = (target + 1) % nodeCount;
    }
    edges.push({
      id: `edge-${i}`,
      source: `node-${source}`,
      target: `node-${target}`,
      type: 'default'
    });
  }
  return edges;
}

/** 转为 Vue-Flow 节点格式（与 generateFlowNodes 同源数据） */
export function toVueFlowNodes(flowNodes: FlowNode[]): Node[] {
  return flowNodes.map(n => ({
    id: n.id,
    type: n.type || 'default',
    position: { ...n.position },
    data: n.data ?? {},
    width: n.size?.width ?? DEFAULT_NODE_WIDTH,
    height: n.size?.height ?? DEFAULT_NODE_HEIGHT,
    dimensions: {
      width: n.size?.width ?? DEFAULT_NODE_WIDTH,
      height: n.size?.height ?? DEFAULT_NODE_HEIGHT
    }
  }));
}

export const BENCHMARK_VUE_FLOW_VIEWPORT = { x: 0, y: 0, zoom: 1 };

export function toVueFlowEdges(flowEdges: FlowEdge[]): Edge[] {
  return flowEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type || 'default'
  }));
}

export const BENCHMARK_VIEWPORT = {
  x: 0,
  y: 0,
  zoom: 1
};

export const BENCHMARK_VIEWPORT_BOUNDS = {
  minX: 0,
  minY: 0,
  maxX: 1000,
  maxY: 1000,
  width: 1000,
  height: 1000
};

export const DEFAULT_NODE_SIZE = {
  width: DEFAULT_NODE_WIDTH,
  height: DEFAULT_NODE_HEIGHT
};
