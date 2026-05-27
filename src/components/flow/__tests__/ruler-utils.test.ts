/** 刻度尺与网格吸附工具单测 */

import { describe, expect, it } from 'vitest';
import {
  computeRulerTicks,
  flowPointToScreen,
  formatRulerLabel,
  getNiceLabelInterval,
  getNiceTickInterval,
  snapPositionToGrid
} from '../utils/ruler-utils';

describe('ruler-utils', () => {
  it('snaps position to grid', () => {
    expect(snapPositionToGrid({ x: 23, y: 37 }, 20)).toEqual({ x: 20, y: 40 });
    expect(snapPositionToGrid({ x: 662, y: 130 }, 20)).toEqual({ x: 660, y: 140 });
  });

  it('formats ruler labels', () => {
    expect(formatRulerLabel(0)).toBe('0');
    expect(formatRulerLabel(120)).toBe('120');
  });

  it('picks adaptive tick interval from zoom', () => {
    expect(getNiceTickInterval(1)).toBe(100);
    expect(getNiceTickInterval(2)).toBe(50);
  });

  it('picks adaptive label interval aligned to grid', () => {
    expect(getNiceLabelInterval(1, 20)).toBe(40);
    expect(getNiceLabelInterval(2, 20)).toBe(20);
    expect(getNiceLabelInterval(0.5, 20)).toBe(100);
  });

  it('computes horizontal ruler ticks within viewport', () => {
    const ticks = computeRulerTicks({
      viewport: { x: 0, y: 0, zoom: 1 },
      canvasSize: 400,
      rulerSize: 24,
      axis: 'horizontal',
      gridSize: 20
    });
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.some(tick => tick.isMajor)).toBe(true);
    expect(ticks.some(tick => tick.level === 'major' && tick.label === '40')).toBe(true);
    /** 在 gridSize 倍数（非 label 倍数）处一定有中刻度 */
    expect(ticks.some(tick => tick.level === 'medium' && tick.flowCoord === 60)).toBe(true);
    /** 缩放 1 下，次刻度（gridSize/2 = 10）也应该有 */
    expect(ticks.some(tick => tick.level === 'minor' && tick.flowCoord === 30)).toBe(true);
  });

  it('flowPointToScreen matches node layout (position * zoom + viewport)', () => {
    const viewport = { x: 237, y: 83, zoom: 1 };
    const point = { x: 40, y: 140 };
    const screen = flowPointToScreen(point, viewport);
    expect(screen.x).toBe(point.x * viewport.zoom + viewport.x);
    expect(screen.y).toBe(point.y * viewport.zoom + viewport.y);
  });

  it('ruler tick and snap marker share screenCoord at same flow value', () => {
    const viewport = { x: 237, y: 83, zoom: 1 };
    const ticks = computeRulerTicks({
      viewport,
      canvasSize: 800,
      rulerSize: 24,
      axis: 'horizontal',
      gridSize: 20
    });
    const tick40 = ticks.find(tick => tick.flowCoord === 40);
    const screen = flowPointToScreen({ x: 40, y: 0 }, viewport);
    expect(tick40?.screenCoord).toBe(screen.x);
  });

  it('keeps medium ticks at every gridSize even when labels are sparse', () => {
    const ticks = computeRulerTicks({
      viewport: { x: 0, y: 0, zoom: 0.5 },
      canvasSize: 800,
      rulerSize: 24,
      axis: 'horizontal',
      gridSize: 20
    });
    expect(ticks.some(tick => tick.level === 'medium' && tick.flowCoord === 60)).toBe(true);
    expect(ticks.some(tick => tick.level === 'major' && tick.label === '100')).toBe(true);
  });

  it('drops minor ticks when zoom is too small (< 6px between minor)', () => {
    const ticks = computeRulerTicks({
      viewport: { x: 0, y: 0, zoom: 0.3 },
      canvasSize: 800,
      rulerSize: 24,
      axis: 'horizontal',
      gridSize: 20
    });
    /** halfGrid * zoom = 10 * 0.3 = 3px < 6px, 不画次刻度 */
    expect(ticks.every(tick => tick.flowCoord % 20 === 0)).toBe(true);
  });
});
