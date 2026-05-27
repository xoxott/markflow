/** FlowCanvas 视口层：画布尺寸、fitView、stableViewport 透传 */

import type { Ref } from 'vue';
import { ref } from 'vue';
import type { FlowConfig, FlowNode, FlowViewport } from '../../types';
import type { FlowCanvasEmit } from '../../types/flow-events';
import { computeFitViewViewport } from '../../utils/viewport-utils';

export interface UseFlowCanvasViewportOptions {
  canvasRef: Ref<HTMLElement | null>;
  config: Ref<Readonly<FlowConfig>>;
  nodes: Ref<FlowNode[]>;
  setViewport: (viewport: Partial<FlowViewport>) => void;
  emit: FlowCanvasEmit;
  /** 来自 useFlowCanvasInteractions 的稳定视口引用 */
  stableViewportRef: Ref<FlowViewport>;
}

export function useFlowCanvasViewport(options: UseFlowCanvasViewportOptions) {
  const { canvasRef, config, nodes, setViewport, emit, stableViewportRef } = options;

  /** 实时画布尺寸（屏幕像素），由 ResizeObserver 维护，给视口裁剪用 */
  const canvasSize = ref<{ width: number; height: number }>({ width: 0, height: 0 });
  let canvasResizeObserver: ResizeObserver | null = null;

  const resolveFitViewPadding = (override?: number): number => {
    if (override !== undefined) {
      return override;
    }
    const cfgPad = config.value.canvas?.fitViewPadding;
    if (typeof cfgPad === 'number') {
      return cfgPad;
    }
    if (cfgPad && typeof cfgPad === 'object') {
      return Math.max(cfgPad.x, cfgPad.y);
    }
    return 0.2;
  };

  const fitView = (padding?: number): boolean => {
    const el = canvasRef.value;
    if (!el || nodes.value.length === 0) {
      return false;
    }

    const canvasCfg = config.value.canvas;
    const nodeCfg = config.value.nodes;
    const vp = computeFitViewViewport(nodes.value, {
      width: el.clientWidth,
      height: el.clientHeight,
      padding: resolveFitViewPadding(padding),
      minZoom: canvasCfg?.minZoom,
      maxZoom: canvasCfg?.maxZoom,
      defaultNodeWidth: nodeCfg?.defaultWidth,
      defaultNodeHeight: nodeCfg?.defaultHeight
    });

    if (!vp) {
      return false;
    }

    setViewport(vp);
    emit('viewport-change', vp);
    return true;
  };

  const startResizeObserver = () => {
    if (canvasRef.value && typeof ResizeObserver !== 'undefined') {
      const updateCanvasSize = () => {
        const el = canvasRef.value;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        canvasSize.value = { width: rect.width, height: rect.height };
      };
      updateCanvasSize();
      canvasResizeObserver = new ResizeObserver(updateCanvasSize);
      canvasResizeObserver.observe(canvasRef.value);
    }
  };

  const stopResizeObserver = () => {
    canvasResizeObserver?.disconnect();
    canvasResizeObserver = null;
  };

  const fitViewOnInit = () => {
    if (config.value.canvas?.fitViewOnInit) {
      requestAnimationFrame(() => fitView());
    }
  };

  return {
    canvasSize,
    stableViewportRef,
    fitView,
    startResizeObserver,
    stopResizeObserver,
    fitViewOnInit
  };
}
