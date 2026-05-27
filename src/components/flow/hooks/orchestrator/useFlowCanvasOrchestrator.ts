/**
 * FlowCanvas 编排层
 *
 * 组合 state / viewport / shortcuts / interactions / events，对外保持 UseFlowCanvasCoreReturn
 */

import type { CSSProperties, ComputedRef, Ref } from 'vue';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { FlowEventEmitter } from '../../core/events/FlowEventEmitter';
import type { FlowEdge, FlowNode, FlowPosition, FlowViewport } from '../../types';
import type { FlowGuideLine } from '../../types/flow-guide';
import type { FlowCanvasProps } from '../../types/flow-canvas';
import type { FlowCanvasEmit } from '../../types/flow-events';
import type { FlowSnapshot } from '../../utils/serialization-utils';
import { useFlowConfig } from '../useFlowConfig';
import { useFlowCanvasPropsSync } from '../useFlowCanvasPropsSync';
import { useFlowCanvasConfigSync } from '../useFlowCanvasConfigSync';
import { useFlowCanvasEvents } from '../useFlowCanvasEvents';
import { useFlowCanvasInteractions } from '../useFlowCanvasInteractions';
import { useLayoutLock } from '../useLayoutLock';
import type { useKeyboard } from '../useKeyboard';
import type { useFlowGuides } from '../useFlowGuides';
import { useFlowCanvasState } from './useFlowCanvasState';
import { useFlowCanvasViewport } from './useFlowCanvasViewport';
import { useFlowCanvasShortcuts } from './useFlowCanvasShortcuts';

export interface UseFlowCanvasCoreOptions {
  props: Readonly<FlowCanvasProps>;
  emit: FlowCanvasEmit;
}

/** FlowCanvas 核心返回值 */
export interface UseFlowCanvasCoreReturn {
  config: ReturnType<typeof useFlowConfig>['config'];
  updateConfig: ReturnType<typeof useFlowConfig>['updateConfig'];
  nodes: Ref<FlowNode[]>;
  edges: Ref<FlowEdge[]>;
  viewport: Ref<FlowViewport>;
  selectedNodeIds: Ref<string[]>;
  selectedEdgeIds: Ref<string[]>;
  nodesMap: Ref<Map<string, FlowNode>>;
  getNodeById: (id: string) => FlowNode | undefined;
  canvasRef: Ref<HTMLElement | null>;
  canvasStyle: ComputedRef<CSSProperties>;
  /** 画布 DOM 实测尺寸（屏幕像素），由 ResizeObserver 维护 */
  canvasSize: Ref<{ width: number; height: number }>;
  defaultInstanceId: ComputedRef<string>;
  /** 根据 `node.locked` 派生的锁定节点 ID 列表 */
  lockedNodeIds: ComputedRef<string[]>;
  stableViewportRef: Ref<FlowViewport>;
  /** Phase 5.1：框选矩形状态（屏幕像素） */
  selectionBoxState: Ref<{
    visible: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  }>;
  isPanning: Ref<boolean>;
  draggingNodeId: Ref<string | null>;
  snapGuidePosition: Ref<FlowPosition | null>;
  alignmentGuides: ReturnType<typeof useFlowCanvasInteractions>['nodeDrag']['alignmentGuides'];
  guides: Ref<FlowGuideLine[]>;
  draftGuide: ReturnType<typeof useFlowGuides>['draftGuide'];
  setGuides: ReturnType<typeof useFlowGuides>['setGuides'];
  clearGuides: ReturnType<typeof useFlowGuides>['clearGuides'];
  removeGuide: ReturnType<typeof useFlowGuides>['removeGuide'];
  handleRulerPointerDown: ReturnType<typeof useFlowGuides>['handleRulerPointerDown'];
  handleGuidePointerDown: ReturnType<typeof useFlowGuides>['handleGuidePointerDown'];
  handleGuideDoubleClick: ReturnType<typeof useFlowGuides>['handleGuideDoubleClick'];
  elevatedNodeIds: Ref<Map<string, number>>;
  allocateZIndex: ReturnType<typeof useFlowCanvasInteractions>['nodeDrag']['allocateZIndex'];
  removeZIndex: ReturnType<typeof useFlowCanvasInteractions>['nodeDrag']['removeZIndex'];
  connectionDraft: ReturnType<typeof useFlowCanvasInteractions>['connection']['connectionDraft'];
  connectionPreviewPos: ReturnType<
    typeof useFlowCanvasInteractions
  >['connection']['connectionPreviewPos'];
  handleNodeClick: ReturnType<typeof useFlowCanvasEvents>['handleNodeClick'];
  handleNodeDoubleClick: ReturnType<typeof useFlowCanvasEvents>['handleNodeDoubleClick'];
  handleNodeMouseDown: ReturnType<typeof useFlowCanvasEvents>['handleNodeMouseDown'];
  handleEdgeClick: ReturnType<typeof useFlowCanvasEvents>['handleEdgeClick'];
  handleEdgeDoubleClick: ReturnType<typeof useFlowCanvasEvents>['handleEdgeDoubleClick'];
  handleEdgeDelete: ReturnType<typeof useFlowCanvasEvents>['handleEdgeDelete'];
  handleEdgeEndpointMouseDown: ReturnType<
    typeof useFlowCanvasInteractions
  >['edgeReconnect']['handleEndpointMouseDown'];
  handlePortMouseDown: (
    nodeId: string,
    handleId: string,
    handleType: 'source' | 'target',
    event: MouseEvent
  ) => void;
  addNode: ReturnType<typeof useFlowCanvasState>['addNode'];
  updateNode: ReturnType<typeof useFlowCanvasState>['flowState']['updateNode'];
  removeNode: ReturnType<typeof useFlowCanvasState>['flowState']['removeNode'];
  addEdge: ReturnType<typeof useFlowCanvasState>['addEdge'];
  removeEdge: ReturnType<typeof useFlowCanvasState>['flowState']['removeEdge'];
  undo: ReturnType<typeof useFlowCanvasState>['flowState']['undo'];
  redo: ReturnType<typeof useFlowCanvasState>['flowState']['redo'];
  canUndo: ReturnType<typeof useFlowCanvasState>['flowState']['canUndo'];
  canRedo: ReturnType<typeof useFlowCanvasState>['flowState']['canRedo'];
  setViewport: ReturnType<typeof useFlowCanvasState>['flowState']['setViewport'];
  panViewport: ReturnType<typeof useFlowCanvasState>['flowState']['panViewport'];
  zoomViewport: ReturnType<typeof useFlowCanvasState>['flowState']['zoomViewport'];
  fitView: (padding?: number) => boolean;
  selectNode: ReturnType<typeof useFlowCanvasState>['flowState']['selectNode'];
  selectNodes: ReturnType<typeof useFlowCanvasState>['flowState']['selectNodes'];
  selectEdge: ReturnType<typeof useFlowCanvasState>['flowState']['selectEdge'];
  deselectAll: ReturnType<typeof useFlowCanvasState>['flowState']['deselectAll'];
  startBoxSelection: ReturnType<typeof useFlowCanvasState>['flowState']['startBoxSelection'];
  updateBoxSelection: ReturnType<typeof useFlowCanvasState>['flowState']['updateBoxSelection'];
  finishBoxSelection: ReturnType<typeof useFlowCanvasState>['flowState']['finishBoxSelection'];
  cancelBoxSelection: ReturnType<typeof useFlowCanvasState>['flowState']['cancelBoxSelection'];
  isBoxSelecting: ReturnType<typeof useFlowCanvasState>['flowState']['isBoxSelecting'];
  eventEmitter: FlowEventEmitter;
  registerKeyboardShortcut: ReturnType<typeof useKeyboard>['register'];
  unregisterKeyboardShortcut: ReturnType<typeof useKeyboard>['unregister'];
  layoutLocked: ReturnType<typeof useLayoutLock>['layoutLocked'];
  setLayoutLocked: ReturnType<typeof useLayoutLock>['setLayoutLocked'];
  toggleLayoutLock: ReturnType<typeof useLayoutLock>['toggleLayoutLock'];
  exportJSON: (options?: { includeViewport?: boolean; includeGuides?: boolean }) => FlowSnapshot;
  importJSON: (
    input: unknown,
    options?: { replace?: boolean; includeViewport?: boolean }
  ) => boolean;
  copySelection: () => Promise<boolean>;
  cutSelection: () => Promise<boolean>;
  pasteClipboard: () => Promise<{ nodeIds: string[]; edgeIds: string[] } | null>;
}

export function useFlowCanvasOrchestrator(
  options: UseFlowCanvasCoreOptions
): UseFlowCanvasCoreReturn {
  const { props, emit } = options;

  const { config, updateConfig } = useFlowConfig({
    id: props.id,
    initialConfig: props.config
  });

  const { layoutLocked, setLayoutLocked, toggleLayoutLock } = useLayoutLock(updateConfig);

  const canvasRef = ref<HTMLElement | null>(null);
  const defaultInstanceId = computed(() => props.id || 'default');
  const eventEmitter = new FlowEventEmitter();

  const { flowState, guidesManager, lockedNodeIds, addNode, addEdge, nodesMap, getNodeById } =
    useFlowCanvasState({
      props,
      config,
      emit,
      canvasRef
    });

  const {
    nodes,
    edges,
    viewport,
    selectedNodeIds,
    selectedEdgeIds,
    removeNode,
    updateNode,
    updateEdge,
    removeEdge,
    setViewport,
    panViewport,
    zoomViewport,
    selectNode,
    selectNodes,
    selectEdge,
    deselectAll,
    shouldMultiSelect,
    startBoxSelection,
    updateBoxSelection,
    finishBoxSelection,
    cancelBoxSelection,
    isBoxSelecting,
    setSelectionOptions,
    undo,
    redo,
    canUndo,
    canRedo,
    stateStore
  } = flowState;

  const { start: startConfigSync, stop: stopConfigSync } = useFlowCanvasConfigSync({
    config,
    setSelectionOptions
  });

  const { connection, edgeReconnect, nodeDrag, canvasPan, canvasZoom, stableViewportRef } =
    useFlowCanvasInteractions({
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
      getViewport: () => stateStore.getViewport(),
      emit,
      eventEmitter,
      getGuides: () => guidesManager.guides.value,
      getSelectedNodeIds: () => selectedNodeIds.value
    });

  const {
    draggingNodeId,
    snapGuidePosition,
    alignmentGuides,
    elevatedNodeIds,
    allocateZIndex,
    removeZIndex,
    nodeClickBlocked,
    handleNodeMouseDown: handleNodeMouseDownHook,
    handleNodeMouseMove: handleNodeMouseMoveHook,
    handleNodeMouseUp: handleNodeMouseUpHook
  } = nodeDrag;

  const { handleEndpointMouseDown: handleEdgeEndpointMouseDown } = edgeReconnect;

  const {
    connectionDraft,
    connectionPreviewPos,
    handlePortMouseDown: handlePortMouseDownHook,
    handleMouseMove: handleConnectionMouseMove,
    handleMouseUp: handleConnectionMouseUp
  } = connection;

  const {
    isPanning,
    handleMouseDown: handlePanMouseDown,
    handleMouseMove: handlePanMouseMove,
    handleMouseUp: handlePanMouseUp,
    cleanup: cleanupPan
  } = canvasPan;

  const { handleWheel } = canvasZoom;

  const { canvasSize, fitView, startResizeObserver, stopResizeObserver, fitViewOnInit } =
    useFlowCanvasViewport({
      canvasRef,
      config,
      nodes,
      setViewport,
      emit,
      stableViewportRef
    });

  const {
    keyboard,
    unregisterShortcuts,
    exportJSON,
    importJSON,
    copySelection,
    cutSelection,
    pasteClipboard
  } = useFlowCanvasShortcuts({
    canvasRef,
    config,
    flowState,
    guidesManager,
    addNode,
    addEdge
  });

  const { start: startPropsSync, stop: stopPropsSync } = useFlowCanvasPropsSync({
    nodesSource: computed(() => props.nodes ?? props.initialNodes),
    edgesSource: computed(() => props.edges ?? props.initialEdges),
    viewportSource: computed(() => props.viewport),
    selectionSource: computed(() => props.selection),
    guidesSource: computed(() => props.guides),
    stateStore,
    nodes,
    edges,
    viewport,
    setViewport,
    setSelection: (nodeIds, edgeIds) => {
      flowState.selectionHandler.setSelection(nodeIds, edgeIds);
      stateStore.setSelectedNodeIds(nodeIds);
      stateStore.setSelectedEdgeIds(edgeIds);
    },
    setGuides: guides => guidesManager.setGuides(guides)
  });

  const canvasStyle = computed(
    (): CSSProperties => ({
      position: 'relative',
      width: typeof props.width === 'number' ? `${props.width}px` : props.width,
      height: typeof props.height === 'number' ? `${props.height}px` : props.height,
      overflow: 'hidden',
      backgroundColor: config.value.canvas?.backgroundColor,
      ...(props.style as CSSProperties | undefined)
    })
  );

  const selectionBoxState = ref<{
    visible: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  }>({
    visible: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  });

  const updateSelectionBoxState = () => {
    const snap = flowState.getSelectionBox();
    selectionBoxState.value = {
      visible: snap.visible,
      startX: snap.startX,
      startY: snap.startY,
      currentX: snap.currentX,
      currentY: snap.currentY
    };
  };

  const wrappedStartBoxSelection = (x: number, y: number) => {
    startBoxSelection(x, y);
    updateSelectionBoxState();
  };
  const wrappedUpdateBoxSelection = (x: number, y: number) => {
    updateBoxSelection(x, y);
    updateSelectionBoxState();
  };
  const wrappedFinishBoxSelection = () => {
    const result = finishBoxSelection();
    updateSelectionBoxState();
    return result;
  };
  const wrappedCancelBoxSelection = () => {
    cancelBoxSelection();
    updateSelectionBoxState();
  };

  const shouldStartBoxSelection = (event: MouseEvent): boolean => {
    if (event.button !== 0) return false;
    const cfg = config.value.interaction;
    if (cfg?.enableBoxSelection === false) return false;
    const key = cfg?.boxSelectionKey ?? 'shift';
    switch (key) {
      case 'shift':
        return event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey;
      case 'alt':
        return event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
      case 'ctrl':
        return (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey;
      default:
        return false;
    }
  };

  const {
    handleNodeClick,
    handleNodeMouseDown,
    handleNodeDoubleClick,
    handleEdgeClick,
    handleEdgeDoubleClick,
    handleEdgeDelete,
    cleanup: cleanupEvents
  } = useFlowCanvasEvents({
    canvasRef,
    connection: {
      connectionDraft,
      handleMouseMove: handleConnectionMouseMove,
      handleMouseUp: handleConnectionMouseUp
    },
    edgeReconnect: {
      isReconnecting: edgeReconnect.isReconnecting,
      handleMouseMove: edgeReconnect.handleMouseMove,
      handleMouseUp: edgeReconnect.handleMouseUp
    },
    nodeDrag: {
      draggingNodeId,
      handleNodeMouseDown: handleNodeMouseDownHook,
      handleMouseMove: handleNodeMouseMoveHook,
      handleMouseUp: handleNodeMouseUpHook,
      nodeClickBlocked
    },
    canvasPan: {
      handleMouseDown: handlePanMouseDown,
      handleMouseMove: handlePanMouseMove,
      handleMouseUp: handlePanMouseUp
    },
    boxSelection: {
      start: wrappedStartBoxSelection,
      update: wrappedUpdateBoxSelection,
      finish: wrappedFinishBoxSelection,
      cancel: wrappedCancelBoxSelection,
      isActive: isBoxSelecting,
      shouldStart: shouldStartBoxSelection
    },
    handleWheel,
    viewport,
    config,
    eventEmitter,
    removeEdge,
    selection: {
      shouldMultiSelect,
      selectNode,
      selectEdge,
      deselectAll
    },
    emit: {
      'node-click': (node, event) => emit('node-click', node, event),
      'node-double-click': (node, event) => emit('node-double-click', node, event),
      'edge-click': (edge, event) => emit('edge-click', edge, event),
      'edge-double-click': (edge, event) => emit('edge-double-click', edge, event),
      'viewport-change': vp => emit('viewport-change', vp)
    }
  });

  const handlePortMouseDown = (
    nodeId: string,
    handleId: string,
    handleType: 'source' | 'target',
    event: MouseEvent
  ) => {
    handlePortMouseDownHook(nodeId, handleId, handleType, event);
  };

  const emitNodesUpdate = (next: FlowNode[]) => {
    emit('update:nodes', next);
    emit('nodes-change', next);
  };
  const emitEdgesUpdate = (next: FlowEdge[]) => {
    emit('update:edges', next);
    emit('edges-change', next);
  };
  const emitSelectionUpdate = () => {
    const selection = {
      nodeIds: [...selectedNodeIds.value],
      edgeIds: [...selectedEdgeIds.value]
    };
    emit('update:selection', selection);
    emit('selection-change', selection);
  };
  const emitViewportUpdate = (next: FlowViewport) => {
    emit('update:viewport', next);
  };

  watch(nodes, next => emitNodesUpdate(next), { deep: true, flush: 'post' });
  watch(edges, next => emitEdgesUpdate(next), { deep: true, flush: 'post' });
  watch([selectedNodeIds, selectedEdgeIds], () => emitSelectionUpdate(), { flush: 'post' });
  watch(viewport, next => emitViewportUpdate(next), { deep: true, flush: 'post' });

  onMounted(() => {
    startPropsSync();
    startConfigSync();
    startResizeObserver();
    fitViewOnInit();
  });

  onUnmounted(() => {
    stopPropsSync();
    stopConfigSync();
    cleanupPan();
    cleanupEvents();
    unregisterShortcuts();
    stopResizeObserver();
  });

  return {
    config,
    updateConfig,
    nodes,
    edges,
    viewport,
    selectedNodeIds,
    selectedEdgeIds,
    nodesMap,
    getNodeById,
    canvasRef,
    canvasStyle,
    canvasSize,
    defaultInstanceId,
    lockedNodeIds,
    stableViewportRef,
    selectionBoxState,
    isPanning,
    draggingNodeId,
    snapGuidePosition,
    alignmentGuides,
    guides: guidesManager.guides,
    draftGuide: guidesManager.draftGuide,
    setGuides: guidesManager.setGuides,
    clearGuides: guidesManager.clearGuides,
    removeGuide: guidesManager.removeGuide,
    handleRulerPointerDown: guidesManager.handleRulerPointerDown,
    handleGuidePointerDown: guidesManager.handleGuidePointerDown,
    handleGuideDoubleClick: guidesManager.handleGuideDoubleClick,
    elevatedNodeIds,
    allocateZIndex,
    removeZIndex,
    connectionDraft,
    connectionPreviewPos,
    handleNodeClick,
    handleNodeDoubleClick,
    handleNodeMouseDown,
    handleEdgeClick,
    handleEdgeDoubleClick,
    handleEdgeDelete,
    handleEdgeEndpointMouseDown,
    handlePortMouseDown,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
    setViewport,
    panViewport,
    zoomViewport,
    fitView,
    selectNode,
    selectNodes,
    selectEdge,
    deselectAll,
    undo,
    redo,
    canUndo,
    canRedo,
    startBoxSelection,
    updateBoxSelection,
    finishBoxSelection,
    cancelBoxSelection,
    isBoxSelecting,
    eventEmitter,
    registerKeyboardShortcut: keyboard.register,
    unregisterKeyboardShortcut: keyboard.unregister,
    layoutLocked,
    setLayoutLocked,
    toggleLayoutLock,
    exportJSON,
    importJSON,
    copySelection,
    cutSelection,
    pasteClipboard
  };
}
