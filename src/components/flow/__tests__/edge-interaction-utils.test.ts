/** 连接线交互工具单测 */

import { describe, expect, it } from 'vitest';
import {
  getEdgeClickAreaWidth,
  isEdgeDeletable,
  isEdgeSelectable,
  isEditableTarget,
  shouldHandleFlowKeyboardEvent,
  shouldShowEdgeDeleteButton
} from '../utils/edge-interaction-utils';
import type { FlowEdge } from '../types/flow-edge';

describe('edge-interaction-utils', () => {
  const edge: FlowEdge = { id: 'e1', source: 'a', target: 'b' };

  it('respects global and per-edge selectable flags', () => {
    expect(isEdgeSelectable(edge)).toBe(true);
    expect(isEdgeSelectable({ ...edge, selectable: false })).toBe(false);
    expect(isEdgeSelectable(edge, { interaction: { edgesSelectable: false } })).toBe(false);
  });

  it('respects global and per-edge deletable flags', () => {
    expect(isEdgeDeletable(edge)).toBe(true);
    expect(isEdgeDeletable({ ...edge, deletable: false })).toBe(false);
    expect(isEdgeDeletable(edge, { interaction: { edgesDeletable: false } })).toBe(false);
    expect(isEdgeDeletable(edge, { edges: { deletable: false } })).toBe(false);
  });

  it('returns configured click area width', () => {
    expect(getEdgeClickAreaWidth()).toBe(24);
    expect(getEdgeClickAreaWidth({ edges: { clickAreaWidth: 32 } })).toBe(32);
  });

  it('shows delete button when edge is deletable and config allows', () => {
    expect(shouldShowEdgeDeleteButton(edge)).toBe(true);
    expect(shouldShowEdgeDeleteButton(edge, { edges: { showDeleteButtonOnSelect: false } })).toBe(
      false
    );
    expect(shouldShowEdgeDeleteButton({ ...edge, deletable: false })).toBe(false);
  });

  it('detects editable targets', () => {
    const input = document.createElement('input');
    expect(isEditableTarget(input)).toBe(true);
    expect(isEditableTarget(document.createElement('div'))).toBe(false);
  });

  it('handles keyboard only when canvas is focused', () => {
    const canvas = document.createElement('div');
    document.body.appendChild(canvas);

    canvas.focus();
    expect(shouldHandleFlowKeyboardEvent(new KeyboardEvent('keydown'), canvas)).toBe(true);

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    expect(
      shouldHandleFlowKeyboardEvent(new KeyboardEvent('keydown', { target: input }), canvas)
    ).toBe(false);

    canvas.remove();
    input.remove();
  });
});
