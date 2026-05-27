/** 辅助线工具单测 */

import { describe, expect, it } from 'vitest';
import { applyFlowSnap, snapPositionToGuides } from '../utils/guide-utils';
import type { FlowGuideLine } from '../types/flow-guide';

describe('guide-utils', () => {
  const guides: FlowGuideLine[] = [
    { id: 'g1', axis: 'vertical', position: 100 },
    { id: 'g2', axis: 'horizontal', position: 80 }
  ];

  it('snaps to nearby guide lines', () => {
    expect(snapPositionToGuides({ x: 103, y: 77 }, guides, 8)).toEqual({ x: 100, y: 80 });
  });

  it('applies guide snap before grid snap', () => {
    const result = applyFlowSnap(
      { x: 103, y: 77 },
      {
        snapToGuides: true,
        snapToGrid: true,
        guides,
        guideSnapThreshold: 8,
        gridSize: 20
      }
    );
    expect(result).toEqual({ x: 100, y: 80 });
  });
});
