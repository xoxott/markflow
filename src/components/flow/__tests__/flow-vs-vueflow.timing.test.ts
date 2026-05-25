/**
 * 视口查询耗时（单次循环，输出到控制台供文档引用）
 *
 * 运行: pnpm vitest run flow-vs-vueflow.timing
 */

import { type GraphNode, getNodesInside } from '@vue-flow/core';
import { describe, expect, it } from 'vitest';
import { SpatialIndex } from '../core/performance/SpatialIndex';
import {
  BENCHMARK_VIEWPORT_BOUNDS,
  BENCHMARK_VUE_FLOW_VIEWPORT,
  generateFlowNodes,
  toVueFlowNodes
} from './benchmark-data';

function linearViewportFilter(
  nodes: ReturnType<typeof generateFlowNodes>,
  bounds: typeof BENCHMARK_VIEWPORT_BOUNDS
) {
  const { minX, minY, maxX, maxY } = bounds;
  const width = 220;
  const height = 72;
  return nodes.filter(node => {
    const x = node.position.x;
    const y = node.position.y;
    return !(x + width < minX || x > maxX || y + height < minY || y > maxY);
  });
}

describe('viewport query timing (single-threaded loop)', () => {
  const iterations = 200;
  const counts = [1000, 10000] as const;

  for (const count of counts) {
    it(`logs ${count} nodes query ms`, () => {
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

      const rTreeStart = performance.now();
      for (let i = 0; i < iterations; i += 1) {
        spatialIndex.query(BENCHMARK_VIEWPORT_BOUNDS);
      }
      const rTreeMs = performance.now() - rTreeStart;

      const linearStart = performance.now();
      for (let i = 0; i < iterations; i += 1) {
        linearViewportFilter(flowNodes, BENCHMARK_VIEWPORT_BOUNDS);
      }
      const linearMs = performance.now() - linearStart;

      const vueFlowStart = performance.now();
      for (let i = 0; i < iterations; i += 1) {
        getNodesInside(vueFlowNodes as GraphNode[], rect, BENCHMARK_VUE_FLOW_VIEWPORT, true, true);
      }
      const vueFlowMs = performance.now() - vueFlowStart;

      expect(rTreeMs).toBeGreaterThan(0);
      expect(linearMs).toBeGreaterThan(0);

      if (count === 10000) {
        expect(rTreeMs).toBeLessThan(linearMs);
      }

      // eslint-disable-next-line no-console
      console.info(
        `[viewport ${count} x${iterations}] Flow-RTree=${rTreeMs.toFixed(2)}ms Linear=${linearMs.toFixed(2)}ms VueFlow-getNodesInside=${vueFlowMs.toFixed(2)}ms`
      );
    });
  }
});
