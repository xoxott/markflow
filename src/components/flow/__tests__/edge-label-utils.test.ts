/** 连接线标签样式解析单测 */

import { describe, expect, it } from 'vitest';
import { estimateEdgeLabelWidth, resolveEdgeLabelStyle } from '../utils/edge-label-utils';
import type { FlowEdge } from '../types/flow-edge';

describe('edge-label-utils', () => {
  const edge: FlowEdge = {
    id: 'e1',
    source: 'a',
    target: 'b',
    label: '条件 A'
  };

  it('merges global config with edge overrides', () => {
    const resolved = resolveEdgeLabelStyle(edge, {
      edges: { labelFontSize: 14, labelShowBackground: true }
    });
    expect(resolved.fontSize).toBe(14);
    expect(resolved.showBackground).toBe(true);
  });

  it('respects per-edge labelShowBackground', () => {
    const resolved = resolveEdgeLabelStyle(
      { ...edge, labelShowBackground: false },
      { edges: { labelShowBackground: true } }
    );
    expect(resolved.showBackground).toBe(false);
  });

  it('estimates CJK label width closer to 1em per character', () => {
    expect(estimateEdgeLabelWidth('是', 13)).toBe(19.5);
    expect(estimateEdgeLabelWidth('默认分支', 13)).toBe(52);
  });
});
