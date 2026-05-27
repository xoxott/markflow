/**
 * 节点拖拽 Hook
 *
 * 处理节点的拖拽功能，基于通用的 useDrag hook 实现。 支持坐标转换（屏幕坐标 -> 画布坐标）、点击/拖拽区分等。
 */

import { type Ref, ref } from 'vue';
import { logger } from '../utils/logger';
import type { FlowConfig, FlowNode, FlowPosition, FlowViewport } from '../types';
import type { FlowGuideLine } from '../types/flow-guide';
import { type AlignmentGuideLines, snapPositionToAlignment } from '../utils/alignment-utils';
import { applyFlowSnap } from '../utils/guide-utils';
import { useDrag } from './useDrag';
import { useClickDragDistinction } from './useClickDragDistinction';
import { useZIndexAllocator } from './useZIndexAllocator';

export interface UseNodeDragOptions {
  /** 画布配置 */
  config: Ref<Readonly<FlowConfig>>;
  /** 视口状态 */
  viewport: Ref<FlowViewport>;
  /** 节点列表 */
  nodes: Ref<FlowNode[]>;
  /** 节点 Map（用于快速查找） */
  nodesMap: Ref<Map<string, FlowNode>>;
  /** 更新节点位置的回调 */
  onNodePositionUpdate: (nodeId: string, x: number, y: number) => void;
  /** 用户辅助线（用于吸附） */
  getGuides?: () => FlowGuideLine[];
  /** Phase 5.2：返回当前选中的节点 ID 数组（用于多选拖拽） */
  getSelectedNodeIds?: () => string[];
}

export interface UseNodeDragReturn {
  /** 正在拖拽的节点 ID */
  draggingNodeId: Ref<string | null>;
  /** 已提升层级的节点 ID 映射（节点 ID -> z-index 值，包括拖拽释放和选中的节点） */
  elevatedNodeIds: Ref<Map<string, number>>;
  /** 分配递增的 z-index（用于拖拽释放和选中节点） */
  allocateZIndex: (nodeId: string) => number;
  /** 移除节点的 z-index */
  removeZIndex: (nodeId: string) => void;
  /** 是否点击被阻止（用于区分拖拽和点击） */
  nodeClickBlocked: Ref<boolean>;
  /** 处理节点鼠标按下事件 */
  handleNodeMouseDown: (node: FlowNode, event: MouseEvent) => void;
  /** 处理节点鼠标移动事件 */
  handleNodeMouseMove: (event: MouseEvent) => void;
  /** 处理节点鼠标抬起事件 */
  handleNodeMouseUp: () => void;
  /** 当前吸附参考位置（拖拽且 snapToGrid 时） */
  snapGuidePosition: Ref<FlowPosition | null>;
  /** Phase 5.4：节点对齐参考线（拖拽时） */
  alignmentGuides: Ref<AlignmentGuideLines>;
  /** 清除样式缓存的回调（用于在拖拽时清除缓存） */
  clearStyleCache?: () => void;
}

/**
 * 节点拖拽 Hook
 *
 * 基于通用的 useDrag hook 实现节点拖拽功能。 支持坐标转换（屏幕坐标 -> 画布坐标）、点击/拖拽区分等。
 *
 * @param options 节点拖拽配置选项
 * @returns 节点拖拽相关的状态和方法
 */
export function useNodeDrag(options: UseNodeDragOptions): UseNodeDragReturn {
  const { config, viewport, nodes, nodesMap, onNodePositionUpdate, getGuides, getSelectedNodeIds } =
    options;

  /** 正在拖拽的节点 ID（用于 z-index 管理） */
  const draggingNodeId = ref<string | null>(null);
  const snapGuidePosition = ref<FlowPosition | null>(null);
  const alignmentGuides = ref<AlignmentGuideLines>({ vertical: [], horizontal: [] });

  /** 当前拖拽的节点 ID（内部使用，也作为 anchor 节点） */
  let currentNodeId: string | null = null;
  /** Phase 5.2：多选拖拽时记录的初始位置（包含 anchor 自身） */
  let initialPositions: Map<string, FlowPosition> | null = null;

  const getNodeSizeDefaults = () => {
    const nodesCfg = config.value.nodes;
    return {
      width: nodesCfg?.defaultWidth ?? 220,
      height: nodesCfg?.defaultHeight ?? 72
    };
  };

  const getExcludeNodeIds = (): Set<string> => {
    const exclude = new Set<string>();
    if (currentNodeId) {
      exclude.add(currentNodeId);
    }
    initialPositions?.forEach((_, id) => exclude.add(id));
    return exclude;
  };

  const applySnapIfEnabled = (x: number, y: number): FlowPosition => {
    const canvas = config.value.canvas;
    const snapToAlignment = canvas?.snapToAlignment !== false;
    const snapToGuides = canvas?.snapToGuides !== false;
    const snapToGrid = Boolean(canvas?.snapToGrid);
    let pos = { x, y };

    const movingNode = currentNodeId ? nodesMap.value.get(currentNodeId) : undefined;
    if (snapToAlignment && movingNode) {
      const threshold = canvas?.alignmentSnapThreshold ?? canvas?.guideSnapThreshold ?? 8;
      const others = nodes.value.filter(n => !getExcludeNodeIds().has(n.id));
      const aligned = snapPositionToAlignment(
        pos,
        movingNode,
        others,
        threshold,
        getNodeSizeDefaults()
      );
      pos = aligned.position;
      alignmentGuides.value = aligned.guides;
    } else {
      alignmentGuides.value = { vertical: [], horizontal: [] };
    }

    if (!snapToGuides && !snapToGrid) {
      snapGuidePosition.value = pos;
      return pos;
    }

    const snapped = applyFlowSnap(pos, {
      snapToGuides,
      snapToGrid,
      guides: getGuides?.() ?? [],
      guideSnapThreshold: canvas?.guideSnapThreshold,
      gridSize: canvas?.gridSize
    });
    snapGuidePosition.value = snapped;
    return snapped;
  };

  // 使用点击/拖拽区分 Hook
  const { isClickBlocked: nodeClickBlocked, markDragOccurred } = useClickDragDistinction({
    blockDuration: 300
  });

  // 使用 Z-index 分配器 Hook
  const {
    allocatedZIndexes: elevatedNodeIds,
    allocate: allocateZIndex,
    remove: removeZIndex
  } = useZIndexAllocator();

  // 使用通用的拖拽 hook
  const drag = useDrag({
    useRAF: () => config.value.performance?.enableRAFThrottle !== false,
    transformCoordinates: (
      screenX,
      screenY,
      startScreenX,
      startScreenY,
      startNodeX,
      startNodeY
    ) => {
      // 计算屏幕坐标偏移
      const screenDeltaX = screenX - startScreenX;
      const screenDeltaY = screenY - startScreenY;

      // 将屏幕坐标偏移转换为画布坐标偏移（除以缩放比例）
      const deltaX = screenDeltaX / viewport.value.zoom;
      const deltaY = screenDeltaY / viewport.value.zoom;

      // 计算新的节点位置（画布坐标）
      const raw = {
        x: startNodeX + deltaX,
        y: startNodeY + deltaY
      };
      const snapped = applySnapIfEnabled(raw.x, raw.y);
      return {
        x: snapped.x,
        y: snapped.y,
        deltaX: screenDeltaX,
        deltaY: screenDeltaY
      };
    },

    // 拖拽更新回调
    onDrag: result => {
      if (!currentNodeId) {
        logger.warn('[useNodeDrag] onDrag: currentNodeId 为空，无法更新节点位置');
        return;
      }

      // Phase 5.2：多选拖拽：以 anchor delta 同步移动所有选中节点
      if (initialPositions && initialPositions.size > 1) {
        const anchorInitial = initialPositions.get(currentNodeId);
        if (anchorInitial) {
          const dx = result.x - anchorInitial.x;
          const dy = result.y - anchorInitial.y;
          initialPositions.forEach((initial, nodeId) => {
            onNodePositionUpdate(nodeId, initial.x + dx, initial.y + dy);
          });
          return;
        }
      }

      onNodePositionUpdate(currentNodeId, result.x, result.y);
    },

    // 拖拽结束回调：处理点击/拖拽区分
    onDragEnd: hasMoved => {
      if (hasMoved) {
        // 标记拖拽发生，阻止后续的点击事件
        markDragOccurred();

        // 记录拖拽的节点（用于保持 z-index）
        // 只有在配置启用时才记录
        if (config.value.nodes?.elevateOnDragEnd !== false && currentNodeId) {
          allocateZIndex(currentNodeId);
        }
      }

      // 清除拖拽节点 ID
      draggingNodeId.value = null;
      currentNodeId = null;
      initialPositions = null;
      snapGuidePosition.value = null;
      alignmentGuides.value = { vertical: [], horizontal: [] };
    }
  });

  /**
   * 处理节点鼠标按下事件
   *
   * 检查节点是否可拖拽，记录节点信息，开始拖拽
   *
   * @param node 节点对象
   * @param event 鼠标按下事件
   */
  const handleNodeMouseDown = (node: FlowNode, event: MouseEvent) => {
    // 检查是否点击在端口上
    const target = event.target as HTMLElement;
    if (target.closest('.flow-handle')) {
      return;
    }

    // 检查节点是否可拖拽
    const draggable = node.draggable !== false && config.value.nodes?.draggable !== false;
    if (!draggable || node.locked) {
      return;
    }

    // 记录拖拽节点 ID（用于提升 z-index）
    draggingNodeId.value = node.id;
    currentNodeId = node.id;

    // Phase 5.2：如果当前节点在多选中，则收集所有选中节点的初始位置作为多选拖拽锚点集合
    const selectedIds = getSelectedNodeIds?.() ?? [];
    if (
      selectedIds.length > 1 &&
      selectedIds.includes(node.id) &&
      config.value.interaction?.enableMultiSelection !== false
    ) {
      const positions = new Map<string, FlowPosition>();
      for (const id of selectedIds) {
        const n = nodesMap.value.get(id);
        if (!n) continue;
        // 锁定节点不参与多选拖拽
        if (n.locked) continue;
        if (n.draggable === false) continue;
        positions.set(id, { x: n.position.x, y: n.position.y });
      }
      initialPositions = positions.size > 1 ? positions : null;
    } else {
      initialPositions = null;
    }

    // 开始拖拽（传入节点的初始位置）
    drag.handleMouseDown(event, node.position.x, node.position.y);

    event.stopPropagation();
  };

  return {
    draggingNodeId,
    elevatedNodeIds,
    allocateZIndex,
    removeZIndex,
    nodeClickBlocked,
    handleNodeMouseDown,
    handleNodeMouseMove: drag.handleMouseMove,
    handleNodeMouseUp: drag.handleMouseUp,
    snapGuidePosition,
    alignmentGuides
  };
}
