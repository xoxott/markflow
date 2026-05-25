/** FlowCanvas 交互逻辑（连接、拖拽、平移、缩放） */

import type { Ref } from 'vue';
import { ref, watch } from 'vue';
import type { FlowConfig, FlowEdge, FlowNode, FlowViewport } from '../types';
import type { FlowEventEmitter } from '../core/events/FlowEventEmitter';
import type { FlowCanvasEmit } from './useFlowCanvasCore';
import { useConnectionCreation } from './useConnectionCreation';
import { useNodeDrag } from './useNodeDrag';
import { useCanvasPan } from './useCanvasPan';
import { useCanvasZoom } from './useCanvasZoom';

export interface UseFlowCanvasInteractionsOptions {
  config: Ref<Readonly<FlowConfig>>;
  nodes: Ref<FlowNode[]>;
  nodesMap: Ref<Map<string, FlowNode>>;
  viewport: Ref<FlowViewport>;
  canvasRef: Ref<HTMLElement | null>;
  updateNode: (nodeId: string, updates: Partial<FlowNode>) => void;
  addEdge: (edge: FlowEdge) => void;
  panViewport: (deltaX: number, deltaY: number) => void;
  zoomViewport: (zoom: number, centerX?: number, centerY?: number) => void;
  getViewport: () => FlowViewport;
  emit: FlowCanvasEmit;
  eventEmitter: FlowEventEmitter;
}

export function useFlowCanvasInteractions(options: UseFlowCanvasInteractionsOptions) {
  const {
    config,
    nodes,
    nodesMap,
    viewport,
    canvasRef,
    updateNode,
    addEdge,
    panViewport,
    zoomViewport,
    getViewport,
    emit,
    eventEmitter
  } = options;

  const emitViewportChange = (vp: FlowViewport) => {
    emit('viewport-change', vp);
  };

  const connection = useConnectionCreation({
    config,
    nodes,
    onCreateEdge: edge => {
      addEdge(edge);
      emit('connect', edge);
      eventEmitter.emit('onConnect', edge);
    },
    onConnect: edge => {
      emit('connect', edge);
      eventEmitter.emit('onConnect', edge);
    }
  });

  const nodeDrag = useNodeDrag({
    config,
    viewport,
    nodes,
    nodesMap,
    onNodePositionUpdate: (nodeId, x, y) => {
      updateNode(nodeId, { position: { x, y } });
    }
  });

  const canvasPan = useCanvasPan({
    config,
    viewport,
    onPan: (deltaX, deltaY) => {
      panViewport(deltaX, deltaY);
    },
    onViewportChange: () => {
      const vp = getViewport();
      emitViewportChange(vp);
      eventEmitter.emit('onCanvasPan', vp);
    }
  });

  const stableViewportRef = ref<FlowViewport>(viewport.value);

  watch(canvasPan.isPanning, (isPanningNow, wasPanning) => {
    if (!isPanningNow && wasPanning) {
      stableViewportRef.value = viewport.value;
    }
  });

  watch(
    viewport,
    () => {
      if (!canvasPan.isPanning.value) {
        stableViewportRef.value = viewport.value;
      }
    },
    { immediate: true }
  );

  const canvasZoom = useCanvasZoom({
    config,
    viewport,
    canvasRef,
    onZoom: (zoom, centerX, centerY) => {
      zoomViewport(zoom, centerX, centerY);
      const vp = getViewport();
      emitViewportChange(vp);
      eventEmitter.emit('onCanvasZoom', vp);
    }
  });

  return {
    connection,
    nodeDrag,
    canvasPan,
    canvasZoom,
    stableViewportRef
  };
}
