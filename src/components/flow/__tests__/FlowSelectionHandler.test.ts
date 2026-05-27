/** FlowSelectionHandler 框选坐标换算单测 */

import { describe, expect, it } from 'vitest';
import { FlowSelectionHandler } from '../core/interaction/FlowSelectionHandler';
import type { FlowNode } from '../types/flow-node';

describe('FlowSelectionHandler.finishBoxSelection', () => {
  const nodes: FlowNode[] = [
    {
      id: 'n1',
      type: 'default',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 72 },
      data: { label: 'A' }
    },
    {
      id: 'n2',
      type: 'default',
      position: { x: 500, y: 400 },
      size: { width: 200, height: 72 },
      data: { label: 'B' }
    }
  ];

  it('converts client coordinates using canvas offset and viewport', () => {
    const handler = new FlowSelectionHandler();
    const canvasOffset = { left: 200, top: 100 };
    const viewport = { x: 50, y: 30, zoom: 1 };

    // client (300,130) → canvas-local (100,30) → flow (50,0)
    // client (500,272) → canvas-local (300,172) → flow (250,142)
    handler.startBoxSelection(300, 130);
    handler.updateBoxSelection(500, 272);

    const result = handler.finishBoxSelection(nodes, [], viewport, canvasOffset);

    expect(result.nodeIds).toEqual(['n1']);
  });

  it('respects zoom when converting selection box', () => {
    const handler = new FlowSelectionHandler();
    const canvasOffset = { left: 0, top: 0 };
    const viewport = { x: 0, y: 0, zoom: 2 };

    // flow box (90,90)-(310,190) → screen box (180,180)-(620,380)
    handler.startBoxSelection(180, 180);
    handler.updateBoxSelection(620, 380);

    const result = handler.finishBoxSelection(nodes, [], viewport, canvasOffset);

    expect(result.nodeIds).toEqual(['n1']);
  });
});
