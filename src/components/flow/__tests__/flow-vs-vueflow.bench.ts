/**
 * Flow vs Vue-Flow 性能基准（算法层 + 挂载层）
 *
 * 运行: pnpm bench:compare
 */

import { bench, describe } from 'vitest';
import { type GraphNode, getNodesInside } from '@vue-flow/core';
import { SpatialIndex } from '../core/performance/SpatialIndex';
import {
  BENCHMARK_VIEWPORT_BOUNDS,
  BENCHMARK_VUE_FLOW_VIEWPORT,
  DEFAULT_NODE_SIZE,
  generateFlowEdges,
  generateFlowNodes,
  toVueFlowNodes
} from './benchmark-data';

function linearViewportFilter(nodes: ReturnType<typeof generateFlowNodes>) {
  const { minX, minY, maxX, maxY } = BENCHMARK_VIEWPORT_BOUNDS;
  const { width, height } = DEFAULT_NODE_SIZE;
  return nodes.filter(node => {
    const x = node.position.x;
    const y = node.position.y;
    return !(x + width < minX || x > maxX || y + height < minY || y > maxY);
  });
}

describe('Viewport query: Flow SpatialIndex vs linear (Vue-Flow getNodesInside style)', () => {
  const counts = [1000, 10000] as const;

  for (const count of counts) {
    const flowNodes = generateFlowNodes(count);
    const vueFlowNodes = toVueFlowNodes(flowNodes);
    const spatialIndex = new SpatialIndex();
    spatialIndex.updateNodes(flowNodes);

    const rect = {
      x: BENCHMARK_VIEWPORT_BOUNDS.minX,
      y: BENCHMARK_VIEWPORT_BOUNDS.minY,
      width: BENCHMARK_VIEWPORT_BOUNDS.width,
      height: BENCHMARK_VIEWPORT_BOUNDS.height
    };

    bench(`[${count} nodes] Flow R-Tree query (x50)`, () => {
      for (let i = 0; i < 50; i += 1) {
        spatialIndex.query(BENCHMARK_VIEWPORT_BOUNDS);
      }
    });

    bench(`[${count} nodes] Linear filter (Flow fallback, x50)`, () => {
      for (let i = 0; i < 50; i += 1) {
        linearViewportFilter(flowNodes);
      }
    });

    bench(`[${count} nodes] Vue-Flow getNodesInside (x50)`, () => {
      for (let i = 0; i < 50; i += 1) {
        getNodesInside(vueFlowNodes as GraphNode[], rect, BENCHMARK_VUE_FLOW_VIEWPORT, true, true);
      }
    });
  }
});

describe('Edge data generation parity', () => {
  bench('generate 500 edges for 1000 nodes', () => {
    generateFlowEdges(1000, 500);
  });
});
