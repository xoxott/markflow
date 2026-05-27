/**
 * Flow Canvas 渲染器（类 API，供 bench / 高级集成）
 *
 * 生产环境边渲染请使用 EdgeCanvasRenderer 组件；绘制逻辑与 edge-canvas-draw 共用。
 */

import { PERFORMANCE_CONSTANTS } from '../../constants/performance-constants';
import type { FlowEdge } from '../../types/flow-edge';
import type { FlowNode } from '../../types/flow-node';
import type { FlowViewport } from '../../types/flow-config';
import type { EdgePositions } from '../../hooks/useEdgePositions';
import { drawEdgesOnCanvas, ensureCanvasLayoutSize } from '../../utils/edge-canvas-draw';

/** Canvas 渲染选项 */
export interface CanvasRenderOptions {
  enabled?: boolean;
  threshold?: number;
  enableClickDetection?: boolean;
  clickAreaWidth?: number;
}

const { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } = PERFORMANCE_CONSTANTS;

/** Canvas 渲染器 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private options: Required<CanvasRenderOptions> = {
    enabled: true,
    threshold: 200,
    enableClickDetection: true,
    clickAreaWidth: 24
  };
  private clickMap: Map<number, string> = new Map();

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    });
  }

  setOptions(options: Partial<CanvasRenderOptions>): void {
    this.options = { ...this.options, ...options };
  }

  shouldUseCanvas(edgeCount: number): boolean {
    return this.options.enabled && edgeCount >= this.options.threshold;
  }

  private createGetEdgePositions(
    nodes: FlowNode[],
    viewport: FlowViewport
  ): (edge: FlowEdge) => EdgePositions | null {
    const nodeMap = new Map<string, FlowNode>();
    nodes.forEach(node => nodeMap.set(node.id, node));

    return (edge: FlowEdge): EdgePositions | null => {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);
      if (!sourceNode || !targetNode) {
        return null;
      }

      const sourceX = sourceNode.position.x + (sourceNode.size?.width || DEFAULT_NODE_WIDTH) / 2;
      const sourceY = sourceNode.position.y + (sourceNode.size?.height || DEFAULT_NODE_HEIGHT) / 2;
      const targetX = targetNode.position.x + (targetNode.size?.width || DEFAULT_NODE_WIDTH) / 2;
      const targetY = targetNode.position.y + (targetNode.size?.height || DEFAULT_NODE_HEIGHT) / 2;

      return {
        sourceX: sourceX * viewport.zoom + viewport.x,
        sourceY: sourceY * viewport.zoom + viewport.y,
        targetX: targetX * viewport.zoom + viewport.x,
        targetY: targetY * viewport.zoom + viewport.y
      };
    };
  }

  render(
    edges: FlowEdge[],
    nodes: FlowNode[],
    viewport: FlowViewport,
    selectedEdgeIds: string[] = []
  ): void {
    if (!this.canvas || !this.ctx) {
      return;
    }

    const { width, height } = ensureCanvasLayoutSize(this.canvas, this.ctx);
    const getEdgePositions = this.createGetEdgePositions(nodes, viewport);

    const visibleEdges = edges.filter(edge => {
      const pos = getEdgePositions(edge);
      if (!pos) return false;
      return !(
        (pos.sourceX < 0 && pos.targetX < 0) ||
        (pos.sourceX > width && pos.targetX > width) ||
        (pos.sourceY < 0 && pos.targetY < 0) ||
        (pos.sourceY > height && pos.targetY > height)
      );
    });

    drawEdgesOnCanvas(this.ctx, {
      edges: visibleEdges,
      getEdgePositions,
      viewport,
      selectedEdgeIds,
      clearWidth: width,
      clearHeight: height,
      themeRoot: this.canvas?.closest('.flow-canvas') as HTMLElement | null
    });

    if (this.options.enableClickDetection) {
      this.drawClickDetectionLayer(visibleEdges, getEdgePositions);
    }
  }

  private drawClickDetectionLayer(
    edges: FlowEdge[],
    getEdgePositions: (edge: FlowEdge) => EdgePositions | null
  ): void {
    if (!this.ctx) return;

    this.clickMap.clear();
    edges.forEach((edge, index) => {
      const pos = getEdgePositions(edge);
      if (!pos) return;

      const color = this.generateColorForEdge(index);
      this.ctx!.strokeStyle = color;
      this.ctx!.lineWidth = this.options.clickAreaWidth;
      this.ctx!.beginPath();
      this.ctx!.moveTo(pos.sourceX, pos.sourceY);
      this.ctx!.lineTo(pos.targetX, pos.targetY);
      this.ctx!.stroke();
      this.clickMap.set(this.colorToNumber(color), edge.id);
    });
  }

  detectClick(x: number, y: number): string | null {
    if (!this.canvas || !this.ctx || !this.options.enableClickDetection) {
      return null;
    }

    const imageData = this.ctx.getImageData(x, y, 1, 1);
    const r = imageData.data[0];
    const g = imageData.data[1];
    const b = imageData.data[2];
    const colorNumber = (r << 16) | (g << 8) | b;

    return this.clickMap.get(colorNumber) || null;
  }

  private generateColorForEdge(index: number): string {
    const r = ((index * 7) % 254) + 1;
    const g = ((index * 11) % 254) + 1;
    const b = ((index * 13) % 254) + 1;
    return `rgb(${r},${g},${b})`;
  }

  private colorToNumber(color: string): number {
    const match = color.match(/rgb\((\d+),(\d+),(\d+)\)/);
    if (match) {
      const r = Number.parseInt(match[1]);
      const g = Number.parseInt(match[2]);
      const b = Number.parseInt(match[3]);
      return (r << 16) | (g << 8) | b;
    }
    return 0;
  }

  cleanup(): void {
    this.clickMap.clear();
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}
