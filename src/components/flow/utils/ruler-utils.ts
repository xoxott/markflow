/** 刻度尺与网格吸附工具 */

import type { FlowPosition, FlowViewport } from '../types';

export type RulerTickLevel = 'minor' | 'medium' | 'major';

export interface RulerTick {
  /** 画布坐标 */
  flowCoord: number;
  /** 屏幕坐标（相对画布容器） */
  screenCoord: number;
  /** 刻度层级：minor 网格 / medium 半主刻度 / major 带数字 */
  level: RulerTickLevel;
  /** 主刻度（显示数字） */
  isMajor: boolean;
  label: string;
}

const NICE_STEPS = [1, 2, 5, 10];
const LABEL_CELL_STEPS = [1, 2, 5, 10, 20, 50, 100];

/** 根据缩放选取合适的刻度间隔（画布坐标） */
export function getNiceTickInterval(zoom: number, targetScreenSpacing = 56): number {
  const safeZoom = Math.max(zoom, 0.01);
  const raw = targetScreenSpacing / safeZoom;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const step = NICE_STEPS.find(value => normalized <= value) ?? 10;
  return step * magnitude;
}

/** 数字标注间隔（gridSize 整数倍，随缩放自适应，目标约 36px 屏距） */
export function getNiceLabelInterval(
  zoom: number,
  gridSize: number,
  targetScreenSpacing = 36
): number {
  const safeZoom = Math.max(zoom, 0.01);
  const safeGrid = Math.max(gridSize, 1);
  const minScreen = targetScreenSpacing * 0.85;

  for (const cells of LABEL_CELL_STEPS) {
    const interval = cells * safeGrid;
    if (interval * safeZoom >= minScreen) {
      return interval;
    }
  }

  return LABEL_CELL_STEPS[LABEL_CELL_STEPS.length - 1] * safeGrid;
}

function isFlowOnInterval(flowCoord: number, interval: number): boolean {
  const steps = flowCoord / interval;
  return Math.abs(steps - Math.round(steps)) < 0.001;
}

function resolveTickLevel(
  flowCoord: number,
  gridSize: number,
  labelInterval: number
): RulerTickLevel {
  if (isFlowOnInterval(flowCoord, labelInterval)) {
    return 'major';
  }

  if (gridSize > 0 && isFlowOnInterval(flowCoord, gridSize)) {
    return 'medium';
  }

  return 'minor';
}

/** 将坐标吸附到网格 */
export function snapPositionToGrid(position: FlowPosition, gridSize: number): FlowPosition {
  const size = Math.max(gridSize, 1);
  return {
    x: Math.round(position.x / size) * size,
    y: Math.round(position.y / size) * size
  };
}

/** 画布坐标 → 屏幕坐标（相对 canvas 容器） */
export function flowToScreen(flowCoord: number, viewportOffset: number, zoom: number): number {
  return flowCoord * zoom + viewportOffset;
}

/** 画布点 → 屏幕坐标 */
export function flowPointToScreen(point: FlowPosition, viewport: FlowViewport): FlowPosition {
  return {
    x: flowToScreen(point.x, viewport.x, viewport.zoom),
    y: flowToScreen(point.y, viewport.y, viewport.zoom)
  };
}

/** 屏幕坐标 → 画布坐标 */
export function screenToFlow(screenCoord: number, viewportOffset: number, zoom: number): number {
  const safeZoom = Math.max(zoom, 0.01);
  return (screenCoord - viewportOffset) / safeZoom;
}

export interface ComputeRulerTicksOptions {
  viewport: FlowViewport;
  canvasSize: number;
  rulerSize: number;
  axis: 'horizontal' | 'vertical';
  /** 优先使用 gridSize，否则自适应 */
  gridSize?: number;
}

/** 计算刻度尺可见范围内的刻度 */
export function computeRulerTicks(options: ComputeRulerTicksOptions): RulerTick[] {
  const { viewport, canvasSize, rulerSize, axis, gridSize } = options;
  const zoom = Math.max(viewport.zoom, 0.01);
  const viewportOffset = axis === 'horizontal' ? viewport.x : viewport.y;
  const baseGrid = gridSize && gridSize > 0 ? gridSize : getNiceTickInterval(zoom);
  const labelInterval = gridSize && gridSize > 0 ? getNiceLabelInterval(zoom, gridSize) : baseGrid;

  /**
   * 显示步长（决定要在刻度尺上画多少根线）：
   *
   * - 若 gridSize/2 在屏幕上还有 >=6px 间距，就画次刻度（每 gridSize/2）
   * - 否则只画到 gridSize（中刻度）
   */
  const halfGrid = baseGrid / 2;
  const showMinor = halfGrid * zoom >= 6;
  const displayInterval = showMinor ? halfGrid : baseGrid;

  const flowStart = screenToFlow(rulerSize, viewportOffset, zoom);
  const flowEnd = screenToFlow(canvasSize, viewportOffset, zoom);
  const minFlow = Math.min(flowStart, flowEnd);
  const maxFlow = Math.max(flowStart, flowEnd);

  const firstTick = Math.floor(minFlow / displayInterval) * displayInterval;
  const ticks: RulerTick[] = [];

  for (
    let flowCoord = firstTick;
    flowCoord <= maxFlow + displayInterval * 0.001;
    flowCoord += displayInterval
  ) {
    const screenCoord = flowToScreen(flowCoord, viewportOffset, zoom);
    if (screenCoord < rulerSize - 0.5 || screenCoord > canvasSize + 0.5) {
      continue;
    }

    const level = resolveTickLevel(flowCoord, baseGrid, labelInterval);
    const isMajor = level === 'major';
    ticks.push({
      flowCoord,
      screenCoord,
      level,
      isMajor,
      label: isMajor ? formatRulerLabel(flowCoord) : ''
    });
  }

  return ticks;
}

/** 刻度数字格式化 */
export function formatRulerLabel(value: number): string {
  if (Math.abs(value) < 0.001) {
    return '0';
  }
  if (Math.abs(value) >= 1000) {
    return `${Math.round(value)}`;
  }
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(1).replace(/\.0$/, '');
}
