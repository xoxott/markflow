/**
 * Flow 状态管理 Hook
 *
 * 提供 Vue 3 Composition API 的状态管理 Hook 使用新的架构：DefaultStateStore + DefaultHistoryManager +
 * FlowSelectionHandler
 */

import { type Ref, markRaw, onUnmounted, ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { DefaultStateStore } from '../core/state/stores/DefaultStateStore';
import { DefaultHistoryManager } from '../core/state/stores/DefaultHistoryManager';
import type {
  FlowSelectionHandler,
  SelectionOptions
} from '../core/interaction/FlowSelectionHandler';
import { createVueStateBridge } from '../core/state/adapters/vue-state-bridge';
import {
  createSelectionBridge,
  initSelectionFromNodes
} from '../core/state/adapters/selection-bridge';
import type { FlowNode } from '../types/flow-node';
import type { FlowEdge } from '../types/flow-edge';
import type { FlowViewport } from '../types/flow-config';
import type { FlowStateSnapshot } from '../core/state/types';

/** useFlowState 选项 */
export interface UseFlowStateOptions {
  /** 初始节点列表 */
  initialNodes?: FlowNode[];
  /** 初始连接线列表 */
  initialEdges?: FlowEdge[];
  /** 初始视口状态 */
  initialViewport?: FlowViewport;
  /** 最大历史记录数量 */
  maxHistorySize?: number;
  /** 是否自动保存历史记录（默认 true） */
  autoSaveHistory?: boolean;
  /** 选择选项 */
  selectionOptions?: SelectionOptions;
}

/** useFlowState 返回值 */
export interface UseFlowStateReturn {
  /** 节点列表（响应式） */
  nodes: Ref<FlowNode[]>;
  /** 连接线列表（响应式） */
  edges: Ref<FlowEdge[]>;
  /** 视口状态（响应式） */
  viewport: Ref<FlowViewport>;
  /** 选中的节点 ID 列表（响应式） */
  selectedNodeIds: Ref<string[]>;
  /** 选中的连接线 ID 列表（响应式） */
  selectedEdgeIds: Ref<string[]>;
  /** 状态存储实例（内部使用） */
  stateStore: DefaultStateStore;
  /** 历史记录管理器实例（内部使用） */
  historyManager: DefaultHistoryManager;
  /** 选择处理器实例（内部使用） */
  selectionHandler: FlowSelectionHandler;

  // 节点操作
  addNode: (node: FlowNode) => void;
  addNodes: (nodes: FlowNode[]) => void;
  updateNode: (nodeId: string, updates: Partial<FlowNode>) => void;
  removeNode: (nodeId: string) => void;
  removeNodes: (nodeIds: string[]) => void;
  getNode: (nodeId: string) => FlowNode | undefined;
  hasNode: (nodeId: string) => boolean;

  // 连接线操作
  addEdge: (edge: FlowEdge) => void;
  addEdges: (edges: FlowEdge[]) => void;
  updateEdge: (edgeId: string, updates: Partial<FlowEdge>) => void;
  removeEdge: (edgeId: string) => void;
  removeEdges: (edgeIds: string[]) => void;
  getEdge: (edgeId: string) => FlowEdge | undefined;
  getNodeEdges: (nodeId: string) => FlowEdge[];

  // 视口操作
  setViewport: (viewport: Partial<FlowViewport>) => void;
  panViewport: (deltaX: number, deltaY: number) => void;
  zoomViewport: (zoom: number, centerX?: number, centerY?: number) => void;

  // 选择操作
  selectNode: (nodeId: string, addToSelection?: boolean) => void;
  selectNodes: (nodeIds: string[]) => void;
  selectEdge: (edgeId: string, addToSelection?: boolean) => void;
  deselectAll: () => void;
  getSelectedNodes: () => FlowNode[];
  getSelectedEdges: () => FlowEdge[];
  isNodeSelected: (nodeId: string) => boolean;
  isEdgeSelected: (edgeId: string) => boolean;
  shouldMultiSelect: (event: MouseEvent | KeyboardEvent) => boolean;
  shouldBoxSelect: (event: MouseEvent | KeyboardEvent) => boolean;
  startBoxSelection: (startX: number, startY: number) => void;
  updateBoxSelection: (currentX: number, currentY: number) => void;
  /**
   * 结束框选并将结果应用到选区
   *
   * @returns 框中的节点和边 ID 列表
   */
  finishBoxSelection: (canvasOffset?: { left: number; top: number }) => {
    nodeIds: string[];
    edgeIds: string[];
  };
  cancelBoxSelection: () => void;
  isBoxSelecting: () => boolean;
  getSelectionBox: () => Readonly<import('../core/interaction/FlowSelectionHandler').SelectionBox>;
  setSelectionOptions: (options: Partial<SelectionOptions>) => void;

  // 历史记录操作
  pushHistory: () => void;
  undo: () => boolean;
  redo: () => boolean;
  canUndo: Ref<boolean>;
  canRedo: Ref<boolean>;
  clearHistory: () => void;

  // 状态快照
  createSnapshot: () => FlowStateSnapshot;
  restoreSnapshot: (snapshot: FlowStateSnapshot) => void;
  reset: () => void;
}

/**
 * Flow 状态管理 Hook
 *
 * 提供响应式的状态管理功能
 *
 * @example
 *   ```typescript
 *   const {
 *     nodes,
 *     edges,
 *     addNode,
 *     removeNode,
 *     selectNode
 *   } = useFlowState({
 *     initialNodes: [node1, node2],
 *     initialEdges: [edge1]
 *   });
 *
 *   // 响应式访问
 *   console.log(nodes.value);
 *
 *   // 操作状态
 *   addNode(newNode);
 *   selectNode('node-1');
 *   ```;
 *
 * @param options Hook 选项
 * @returns 状态相关的响应式数据和方法
 */
export function useFlowState(options: UseFlowStateOptions = {}): UseFlowStateReturn {
  const {
    initialNodes,
    initialEdges,
    initialViewport,
    maxHistorySize,
    autoSaveHistory = true,
    selectionOptions
  } = options;

  // ==================== 创建状态存储（框架无关）====================

  // 恢复初始选择状态
  const initialSelectedNodeIds =
    initialNodes?.filter(node => node.selected).map(node => node.id) || [];

  // 使用 markRaw 标记 store 实例，避免 Vue 对其进行深度响应式处理
  // store 是框架无关的状态管理类，不需要响应式
  const store = markRaw(
    new DefaultStateStore({
      nodes: initialNodes,
      edges: initialEdges,
      viewport: initialViewport,
      selectedNodeIds: initialSelectedNodeIds,
      selectedEdgeIds: []
    })
  );

  const { refs: vueRefs, dispose: disposeVueBridge } = createVueStateBridge(store);
  const nodesRef = vueRefs.nodes;
  const edgesRef = vueRefs.edges;
  const viewportRef = vueRefs.viewport;
  const selectedNodeIdsRef = vueRefs.selectedNodeIds;
  const selectedEdgeIdsRef = vueRefs.selectedEdgeIds;

  // ==================== 创建历史记录管理器 ====================

  // 使用 markRaw 标记 historyManager 实例，避免 Vue 对其进行深度响应式处理
  const historyManager = markRaw(
    new DefaultHistoryManager(store, {
      maxHistorySize
    })
  );

  const { handler: selectionHandler } = createSelectionBridge(store, selectionOptions);
  initSelectionFromNodes(selectionHandler, initialSelectedNodeIds);

  // ==================== 自动保存历史记录 ====================

  // ==================== 响应式：是否可以撤销/重做 ====================
  //
  // 注意：DefaultHistoryManager 内部使用普通字段维护 historyIndex / history，
  // 这些字段对 Vue reactivity 不可见，因此不能直接用 `computed(() => historyManager.canUndo())`
  // 来追踪——computed 永远不会被通知重算，导致工具栏按钮 enable 状态僵死。
  //
  // 这里改为：通过 `historyManager.subscribe` 让 historyManager 主动 push 状态到 ref。

  const canUndo = ref<boolean>(historyManager.canUndo());
  const canRedo = ref<boolean>(historyManager.canRedo());

  const syncHistoryFlags = () => {
    canUndo.value = historyManager.canUndo();
    canRedo.value = historyManager.canRedo();
  };

  const unsubscribeHistory = historyManager.subscribe?.(syncHistoryFlags) ?? (() => {});

  if (autoSaveHistory) {
    const debouncedPushHistory = useDebounceFn(() => {
      historyManager.pushHistory();
    }, 300);

    // 使用订阅机制替代深度监听，只监听节点和连接线的变化
    const historyUnsubscribe = store.subscribe(changeType => {
      if (changeType === 'nodes' || changeType === 'edges' || changeType === 'all') {
        debouncedPushHistory();
      }
    });

    onUnmounted(() => {
      historyUnsubscribe();
      unsubscribeHistory();
      disposeVueBridge();
    });
  } else {
    onUnmounted(() => {
      unsubscribeHistory();
      disposeVueBridge();
    });
  }

  // ==================== 返回统一接口 ====================

  return {
    // 响应式状态
    nodes: nodesRef,
    edges: edgesRef,
    viewport: viewportRef,
    selectedNodeIds: selectedNodeIdsRef,
    selectedEdgeIds: selectedEdgeIdsRef,
    stateStore: store,
    historyManager,
    selectionHandler,

    // 节点操作
    addNode: (node: FlowNode) => {
      store.addNode(node);
    },
    addNodes: (nodes: FlowNode[]) => {
      store.addNodes(nodes);
    },
    updateNode: (nodeId: string, updates: Partial<FlowNode>) => {
      store.updateNode(nodeId, updates);
    },
    removeNode: (nodeId: string) => {
      store.removeNode(nodeId);
    },
    removeNodes: (nodeIds: string[]) => {
      store.removeNodes(nodeIds);
    },
    getNode: (nodeId: string) => {
      return store.getNode(nodeId);
    },
    hasNode: (nodeId: string) => {
      return store.hasNode(nodeId);
    },

    // 连接线操作
    addEdge: (edge: FlowEdge) => {
      store.addEdge(edge);
    },
    addEdges: (edges: FlowEdge[]) => {
      store.addEdges(edges);
    },
    updateEdge: (edgeId: string, updates: Partial<FlowEdge>) => {
      store.updateEdge(edgeId, updates);
    },
    removeEdge: (edgeId: string) => {
      store.removeEdge(edgeId);
    },
    removeEdges: (edgeIds: string[]) => {
      store.removeEdges(edgeIds);
    },
    getEdge: (edgeId: string) => {
      return store.getEdge(edgeId);
    },
    getNodeEdges: (nodeId: string) => {
      return store.getNodeEdges(nodeId);
    },

    // 视口操作
    setViewport: (viewport: Partial<FlowViewport>) => {
      store.setViewport(viewport);
    },
    panViewport: (deltaX: number, deltaY: number) => {
      store.panViewport(deltaX, deltaY);
    },
    zoomViewport: (zoom: number, centerX?: number, centerY?: number) => {
      store.zoomViewport(zoom, centerX, centerY);
    },

    // 选择操作
    selectNode: (nodeId: string, addToSelection?: boolean) => {
      selectionHandler.selectNode(nodeId, addToSelection || false);
    },
    selectNodes: (nodeIds: string[]) => {
      selectionHandler.selectNodes(nodeIds);
    },
    selectEdge: (edgeId: string, addToSelection?: boolean) => {
      selectionHandler.selectEdge(edgeId, addToSelection || false);
    },
    deselectAll: () => {
      selectionHandler.deselectAll();
    },
    getSelectedNodes: () => {
      return selectionHandler.getSelectedNodes(store.getNodes());
    },
    getSelectedEdges: () => {
      return selectionHandler.getSelectedEdges(store.getEdges());
    },
    isNodeSelected: (nodeId: string) => {
      return selectionHandler.isNodeSelected(nodeId);
    },
    isEdgeSelected: (edgeId: string) => {
      return selectionHandler.isEdgeSelected(edgeId);
    },
    shouldMultiSelect: (event: MouseEvent | KeyboardEvent) => {
      return selectionHandler.shouldMultiSelect(event);
    },
    shouldBoxSelect: (event: MouseEvent | KeyboardEvent) => {
      return selectionHandler.shouldBoxSelect(event);
    },
    startBoxSelection: (startX: number, startY: number) => {
      selectionHandler.startBoxSelection(startX, startY);
    },
    updateBoxSelection: (currentX: number, currentY: number) => {
      selectionHandler.updateBoxSelection(currentX, currentY);
    },
    finishBoxSelection: (canvasOffset?: { left: number; top: number }) => {
      const result = selectionHandler.finishBoxSelection(
        store.getNodes(),
        store.getEdges(),
        store.getViewport(),
        canvasOffset
      );
      // Phase 5.1：应用框选结果（空框则清空选区）；store 由 selectionBridge 同步
      selectionHandler.setSelection(result.nodeIds, result.edgeIds);
      return result;
    },
    cancelBoxSelection: () => {
      selectionHandler.cancelBoxSelection();
    },
    isBoxSelecting: () => {
      return selectionHandler.isBoxSelecting();
    },
    getSelectionBox: () => {
      return selectionHandler.getSelectionBox();
    },
    setSelectionOptions: (selectionOpts: Partial<SelectionOptions>) => {
      selectionHandler.setOptions(selectionOpts);
    },

    // 历史记录操作
    pushHistory: () => {
      historyManager.pushHistory();
    },
    undo: () => {
      return historyManager.undo();
    },
    redo: () => {
      return historyManager.redo();
    },
    canUndo,
    canRedo,
    clearHistory: () => {
      historyManager.clearHistory();
    },

    // 状态快照
    createSnapshot: () => {
      return historyManager.createSnapshot();
    },
    restoreSnapshot: (snapshot: FlowStateSnapshot) => {
      historyManager.restoreSnapshot(snapshot);
    },
    reset: () => {
      historyManager.reset();
    }
  };
}
