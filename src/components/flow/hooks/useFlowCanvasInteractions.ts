/** FlowCanvas 交互逻辑（连接、拖拽、平移、缩放） */

import type { Ref } from 'vue';
import { ref, watch } from 'vue';
import type { FlowConfig, FlowEdge, FlowNode, FlowViewport } from '../types';
import type { FlowEventEmitter } from '../core/events/FlowEventEmitter';
import type { FlowCanvasEmit } from '../types/flow-events';
import { useConnectionCreation } from './useConnectionCreation';
import { useEdgeReconnect } from './useEdgeReconnect';
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
  updateEdge: (edgeId: string, updates: Partial<FlowEdge>) => void;
  addEdge: (edge: FlowEdge) => void;
  edges: Ref<FlowEdge[]>;
  getGuides?: () => import('../types/flow-guide').FlowGuideLine[];
  /** Phase 5.2：返回当前选中节点 ID，用于多选拖拽 */
  getSelectedNodeIds?: () => string[];
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
    updateEdge,
    addEdge,
    edges,
    panViewport,
    zoomViewport,
    getViewport,
    emit,
    eventEmitter,
    getGuides,
    getSelectedNodeIds
  } = options;

  const emitViewportChange = (vp: FlowViewport) => {
    emit('viewport-change', vp);
  };

  const connection = useConnectionCreation({
    config,
    nodes,
    edges,
    onCreateEdge: edge => {
      addEdge(edge);
      emit('connect', edge);
      eventEmitter.emit('onConnect', edge);
    },
    onConnect: edge => {
      emit('connect', edge);
      eventEmitter.emit('onConnect', edge);
    },
    onConnectReject: info => {
      emit('connect-reject', info);
    }
  });

  const edgeReconnect = useEdgeReconnect({
    config,
    nodes,
    edges,
    updateEdge,
    onEdgeUpdate: edge => {
      emit('edge-update', edge);
      eventEmitter.emit('onEdgeUpdate', edge);
    },
    onConnectReject: info => {
      emit('connect-reject', info);
    }
  });

  const nodeDrag = useNodeDrag({
    config,
    viewport,
    nodes,
    nodesMap,
    onNodePositionUpdate: (nodeId, x, y) => {
      updateNode(nodeId, { position: { x, y } });
    },
    getGuides,
    getSelectedNodeIds
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

  /**
   * 稳定视口：用于节点 / 边的视口裁剪
   *
   * - 平移期间不更新，避免大量节点反复进出视口
   * - 缩放或外部 setViewport 时同步
   * - 始终保存浅拷贝，防止外部修改泄漏到稳定快照
   */
  const stableViewportRef = ref<FlowViewport>({ ...viewport.value });

  watch(canvasPan.isPanning, (isPanningNow, wasPanning) => {
    if (!isPanningNow && wasPanning) {
      // 等 viewport RAF flush 后再同步，避免平移结束瞬间与节点层错位
      requestAnimationFrame(() => {
        stableViewportRef.value = { ...viewport.value };
      });
    }
  });

  watch(
    viewport,
    () => {
      if (!canvasPan.isPanning.value) {
        stableViewportRef.value = { ...viewport.value };
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
    edgeReconnect,
    nodeDrag,
    canvasPan,
    canvasZoom,
    stableViewportRef
  };
}
