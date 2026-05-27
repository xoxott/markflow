/**
 * FlowCanvas 核心逻辑 Hook
 *
 * 将 FlowCanvas 的配置、状态、交互与事件聚合，降低主组件复杂度
 */

import type { CSSProperties, ComputedRef, Ref } from 'vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { FlowEventEmitter } from '../core/events/FlowEventEmitter';
import type { FlowEdge, FlowNode, FlowViewport } from '../types';
import type { FlowCanvasProps } from '../types/flow-canvas';
import { warnUnusedPerformanceFlags } from '../utils/flow-config-warnings';
import { computeFitViewViewport } from '../utils/viewport-utils';
import { registerFlowCanvasShortcuts } from './useFlowCanvasKeyboard';
import { useFlowConfig } from './useFlowConfig';
import { useFlowState } from './useFlowState';
import { useKeyboard } from './useKeyboard';
import { useNodesMap } from './useNodesMap';
import { useFlowCanvasPropsSync } from './useFlowCanvasPropsSync';
import { useFlowCanvasConfigSync } from './useFlowCanvasConfigSync';
import { useFlowCanvasEvents } from './useFlowCanvasEvents';
import { useFlowCanvasInteractions } from './useFlowCanvasInteractions';

/** FlowCanvas 组件 emit 事件映射 */
export interface FlowCanvasEmitMap {
  'node-click': [node: FlowNode, event: MouseEvent];
  'node-double-click': [node: FlowNode, event: MouseEvent];
  'edge-click': [edge: FlowEdge, event: MouseEvent];
  'edge-double-click': [edge: FlowEdge, event: MouseEvent];
  'connect': [edge: FlowEdge];
  'viewport-change': [viewport: FlowViewport];
}

/** 与 defineComponent setup 中的 emit 兼容 */
export type FlowCanvasEmit = <K extends keyof FlowCanvasEmitMap>(
  event: K,
  ...args: FlowCanvasEmitMap[K]
) => void;

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
  defaultInstanceId: ComputedRef<string>;
  emptyLockedNodeIds: string[];
  stableViewportRef: Ref<FlowViewport>;
  isPanning: Ref<boolean>;
  draggingNodeId: Ref<string | null>;
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
  handlePortMouseDown: (
    nodeId: string,
    handleId: string,
    handleType: 'source' | 'target',
    event: MouseEvent
  ) => void;
  addNode: ReturnType<typeof useFlowState>['addNode'];
  updateNode: ReturnType<typeof useFlowState>['updateNode'];
  removeNode: ReturnType<typeof useFlowState>['removeNode'];
  addEdge: ReturnType<typeof useFlowState>['addEdge'];
  removeEdge: ReturnType<typeof useFlowState>['removeEdge'];
  undo: ReturnType<typeof useFlowState>['undo'];
  redo: ReturnType<typeof useFlowState>['redo'];
  canUndo: ReturnType<typeof useFlowState>['canUndo'];
  canRedo: ReturnType<typeof useFlowState>['canRedo'];
  setViewport: ReturnType<typeof useFlowState>['setViewport'];
  panViewport: ReturnType<typeof useFlowState>['panViewport'];
  zoomViewport: ReturnType<typeof useFlowState>['zoomViewport'];
  fitView: (padding?: number) => boolean;
  selectNode: ReturnType<typeof useFlowState>['selectNode'];
  selectNodes: ReturnType<typeof useFlowState>['selectNodes'];
  selectEdge: ReturnType<typeof useFlowState>['selectEdge'];
  deselectAll: ReturnType<typeof useFlowState>['deselectAll'];
  startBoxSelection: ReturnType<typeof useFlowState>['startBoxSelection'];
  updateBoxSelection: ReturnType<typeof useFlowState>['updateBoxSelection'];
  finishBoxSelection: ReturnType<typeof useFlowState>['finishBoxSelection'];
  cancelBoxSelection: ReturnType<typeof useFlowState>['cancelBoxSelection'];
  isBoxSelecting: ReturnType<typeof useFlowState>['isBoxSelecting'];
  eventEmitter: FlowEventEmitter;
  registerKeyboardShortcut: ReturnType<typeof useKeyboard>['register'];
  unregisterKeyboardShortcut: ReturnType<typeof useKeyboard>['unregister'];
}

export function useFlowCanvasCore(options: UseFlowCanvasCoreOptions): UseFlowCanvasCoreReturn {
  const { props, emit } = options;

  const { config, updateConfig } = useFlowConfig({
    id: props.id,
    initialConfig: props.config
  });

  const flowState = useFlowState({
    initialNodes: props.initialNodes,
    initialEdges: props.initialEdges,
    initialViewport: props.initialViewport,
    maxHistorySize: config.value.performance?.maxHistorySize || 50,
    selectionOptions: {
      enableMultiSelection: config.value.interaction?.enableMultiSelection !== false,
      multiSelectKey: config.value.interaction?.multiSelectKey || 'ctrl',
      enableBoxSelection: config.value.interaction?.enableBoxSelection !== false,
      boxSelectionKey: config.value.interaction?.boxSelectionKey || 'shift'
    }
  });

  const {
    nodes,
    edges,
    viewport,
    selectedNodeIds,
    selectedEdgeIds,
    addNode,
    removeNode,
    updateNode,
    addEdge,
    removeEdge,
    setViewport,
    panViewport,
    zoomViewport,
    selectNode,
    selectNodes,
    selectEdge,
    deselectAll,
    isEdgeSelected,
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
    stateStore,
    historyManager
  } = flowState;

  const { start: startConfigSync, stop: stopConfigSync } = useFlowCanvasConfigSync({
    config,
    setSelectionOptions
  });

  const { nodesMap } = useNodesMap({ nodes });
  const getNodeById = (id: string) => nodesMap.value.get(id);

  const canvasRef = ref<HTMLElement | null>(null);
  const emptyLockedNodeIds: string[] = [];
  const defaultInstanceId = computed(() => props.id || 'default');
  const eventEmitter = new FlowEventEmitter();

  const { connection, nodeDrag, canvasPan, canvasZoom, stableViewportRef } =
    useFlowCanvasInteractions({
      config,
      nodes,
      nodesMap,
      viewport,
      canvasRef,
      updateNode,
      addEdge,
      panViewport,
      zoomViewport,
      getViewport: () => stateStore.getViewport(),
      emit,
      eventEmitter
    });

  const {
    draggingNodeId,
    elevatedNodeIds,
    allocateZIndex,
    removeZIndex,
    nodeClickBlocked,
    handleNodeMouseDown: handleNodeMouseDownHook,
    handleNodeMouseMove: handleNodeMouseMoveHook,
    handleNodeMouseUp: handleNodeMouseUpHook
  } = nodeDrag;

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

  const keyboard = useKeyboard({
    enabled: true,
    target: canvasRef
  });

  const unregisterShortcuts = registerFlowCanvasShortcuts(keyboard, {
    selection: {
      getSelectedNodes: (nodeList: FlowNode[]) =>
        nodeList.filter(n => selectedNodeIds.value.includes(n.id)),
      getSelectedEdges: (edgeList: FlowEdge[]) =>
        edgeList.filter(e => selectedEdgeIds.value.includes(e.id)),
      selectNodes,
      selectEdge,
      deselectAll,
      isEdgeSelected
    },
    historyOperations: {
      undo: () => historyManager.undo(),
      redo: () => historyManager.redo(),
      canUndo: () => historyManager.canUndo(),
      canRedo: () => historyManager.canRedo()
    },
    selectedNodeIds,
    selectedEdgeIds,
    nodes,
    edges,
    removeNode,
    removeEdge
  });

  const { start: startPropsSync, stop: stopPropsSync } = useFlowCanvasPropsSync({
    initialNodes: computed(() => props.initialNodes),
    initialEdges: computed(() => props.initialEdges),
    stateStore,
    nodes,
    edges
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

  const {
    handleNodeClick,
    handleNodeMouseDown,
    handleNodeDoubleClick,
    handleEdgeClick,
    handleEdgeDoubleClick,
    cleanup: cleanupEvents
  } = useFlowCanvasEvents({
    canvasRef,
    connection: {
      connectionDraft,
      handleMouseMove: handleConnectionMouseMove,
      handleMouseUp: handleConnectionMouseUp
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
    handleWheel,
    viewport,
    eventEmitter,
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

  onMounted(() => {
    warnUnusedPerformanceFlags(config.value);
    startPropsSync();
    startConfigSync();
    if (config.value.canvas?.fitViewOnInit) {
      requestAnimationFrame(() => fitView());
    }
  });

  onUnmounted(() => {
    stopPropsSync();
    stopConfigSync();
    cleanupPan();
    cleanupEvents();
    unregisterShortcuts();
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
    defaultInstanceId,
    emptyLockedNodeIds,
    stableViewportRef,
    isPanning,
    draggingNodeId,
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
    unregisterKeyboardShortcut: keyboard.unregister
  };
}
