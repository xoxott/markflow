/**
 * Flow 节点列表组件
 *
 * 负责渲染所有节点，支持视口裁剪、虚拟滚动等性能优化
 */

import { type CSSProperties, type PropType, computed, defineComponent, toRef } from 'vue';
import { useFlowCanvasContextOptional } from '../hooks/useFlowCanvasContext';
import { useNodeState } from '../hooks/useNodeState';
import { useNodeStyle } from '../hooks/useNodeStyle';
import { useSpatialIndex } from '../hooks/useSpatialIndex';
import { useViewportCulling } from '../hooks/useViewportCulling';
import { createNodeEventDelegation } from '../utils/event-utils';
import { PERFORMANCE_CONSTANTS } from '../constants/performance-constants';
import { performanceMonitor } from '../utils/performance-monitor';
import type { FlowConfig, FlowNode, FlowViewport } from '../types';
import BaseNode from './nodes/BaseNode';

/** FlowNodes 组件属性 */
export interface FlowNodesProps {
  /** 节点列表 */
  nodes: FlowNode[];
  /** 选中的节点 ID 列表 */
  selectedNodeIds?: string[];
  /** 锁定的节点 ID 列表 */
  lockedNodeIds?: string[];
  /** 正在拖拽的节点 ID（用于 z-index 层级管理） */
  draggingNodeId?: string | null;
  /** 已提升层级的节点 ID 映射（节点 ID -> z-index 值，包括拖拽释放和选中的节点） */
  elevatedNodeIds?: Map<string, number>;
  /** 分配递增的 z-index（用于拖拽释放和选中节点） */
  allocateZIndex?: (nodeId: string) => number;
  /** 移除节点的 z-index */
  removeZIndex?: (nodeId: string) => void;
  /** 视口状态 */
  viewport?: FlowViewport;
  /** 配置（用于判断是否启用拖拽后提升层级） */
  config?: Readonly<FlowConfig>;
  /** 是否启用视口裁剪 */
  enableViewportCulling?: boolean;
  /** 视口裁剪缓冲区（像素） */
  viewportCullingBuffer?: number;
  /** 是否正在平移画布（平移时暂停视口裁剪更新以优化性能） */
  isPanning?: boolean;
  /** 节点点击事件 */
  onNodeClick?: (node: FlowNode, event: MouseEvent) => void;
  /** 节点双击事件 */
  onNodeDoubleClick?: (node: FlowNode, event: MouseEvent) => void;
  /** 节点拖拽开始 */
  onNodeDragStart?: (node: FlowNode, event: MouseEvent) => void;
  /** 节点拖拽 */
  onNodeDrag?: (node: FlowNode, event: MouseEvent) => void;
  /** 节点拖拽结束 */
  onNodeDragStop?: (node: FlowNode, event: MouseEvent) => void;
  /** 端口鼠标按下 */
  onPortMouseDown?: (
    nodeId: string,
    handleId: string,
    handleType: 'source' | 'target',
    event: MouseEvent
  ) => void;
  /** 端口鼠标抬起 */
  onPortMouseUp?: (
    nodeId: string,
    handleId: string,
    handleType: 'source' | 'target',
    event: MouseEvent
  ) => void;
  /** 端口鼠标进入 */
  onPortMouseEnter?: (
    nodeId: string,
    handleId: string,
    handleType: 'source' | 'target',
    event: MouseEvent
  ) => void;
  /** 端口鼠标离开 */
  onPortMouseLeave?: (
    nodeId: string,
    handleId: string,
    handleType: 'source' | 'target',
    event: MouseEvent
  ) => void;
  /** 节点鼠标按下 */
  onNodeMouseDown?: (node: FlowNode, event: MouseEvent) => void;
}

/** Flow 节点列表组件 */
export default defineComponent({
  name: 'FlowNodes',
  props: {
    nodes: {
      type: Array as PropType<FlowNode[]>,
      required: true
    },
    selectedNodeIds: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    lockedNodeIds: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    draggingNodeId: {
      type: String as PropType<string | null>,
      default: undefined
    },
    elevatedNodeIds: {
      type: Object as PropType<Map<string, number>>,
      default: () => new Map()
    },
    viewport: {
      type: Object as PropType<FlowViewport>,
      default: undefined
    },
    config: {
      type: Object as PropType<Readonly<FlowConfig>>,
      default: undefined
    },
    enableViewportCulling: {
      type: Boolean,
      default: undefined
    },
    viewportCullingBuffer: {
      type: Number,
      default: undefined
    },
    isPanning: {
      type: Boolean,
      default: undefined
    },
    onNodeClick: {
      type: Function as PropType<(node: FlowNode, event: MouseEvent) => void>,
      default: undefined
    },
    onNodeDoubleClick: {
      type: Function as PropType<(node: FlowNode, event: MouseEvent) => void>,
      default: undefined
    },
    onNodeDragStart: {
      type: Function as PropType<(node: FlowNode, event: MouseEvent) => void>,
      default: undefined
    },
    onNodeDrag: {
      type: Function as PropType<(node: FlowNode, event: MouseEvent) => void>,
      default: undefined
    },
    onNodeDragStop: {
      type: Function as PropType<(node: FlowNode, event: MouseEvent) => void>,
      default: undefined
    },
    onPortMouseDown: {
      type: Function as PropType<
        (
          nodeId: string,
          handleId: string,
          handleType: 'source' | 'target',
          event: MouseEvent
        ) => void
      >,
      default: undefined
    },
    onPortMouseUp: {
      type: Function as PropType<
        (
          nodeId: string,
          handleId: string,
          handleType: 'source' | 'target',
          event: MouseEvent
        ) => void
      >,
      default: undefined
    },
    onPortMouseEnter: {
      type: Function as PropType<
        (
          nodeId: string,
          handleId: string,
          handleType: 'source' | 'target',
          event: MouseEvent
        ) => void
      >,
      default: undefined
    },
    onPortMouseLeave: {
      type: Function as PropType<
        (
          nodeId: string,
          handleId: string,
          handleType: 'source' | 'target',
          event: MouseEvent
        ) => void
      >,
      default: undefined
    },
    onNodeMouseDown: {
      type: Function as PropType<(node: FlowNode, event: MouseEvent) => void>,
      default: undefined
    },
    allocateZIndex: {
      type: Function as PropType<(nodeId: string) => number>,
      default: undefined
    },
    removeZIndex: {
      type: Function as PropType<(nodeId: string) => void>,
      default: undefined
    }
  },
  setup(props) {
    const canvasCtx = useFlowCanvasContextOptional();

    const nodesRef = toRef(props, 'nodes');
    const selectedNodeIdsRef = computed(() => props.selectedNodeIds || []);
    const lockedNodeIdsRef = computed(() => props.lockedNodeIds || []);
    const draggingNodeIdRef = computed(
      () => props.draggingNodeId ?? canvasCtx?.draggingNodeId.value ?? null
    );
    const elevatedNodeIdsRef = computed(() => props.elevatedNodeIds || new Map());
    const configRef = computed(() => props.config ?? canvasCtx?.config.value);
    const defaultViewport = { x: 0, y: 0, zoom: 1 };
    /** 实时视口：节点屏幕布局须与 FlowViewportContainer 平移同步 */
    const layoutViewportRef = computed(
      () => props.viewport ?? canvasCtx?.viewport.value ?? defaultViewport
    );
    /** 平移时可冻结，仅用于视口裁剪 */
    const cullingViewportRef = computed(
      () => props.viewport ?? canvasCtx?.stableViewport.value ?? defaultViewport
    );
    const enableViewportCullingRef = computed(
      () =>
        props.enableViewportCulling ??
        canvasCtx?.config.value.performance?.enableViewportCulling ??
        true
    );
    const isPanningRef = computed(() => props.isPanning ?? canvasCtx?.isPanning.value ?? false);
    const viewportCullingBuffer = computed(
      () =>
        props.viewportCullingBuffer ??
        canvasCtx?.config.value.performance?.virtualScrollBuffer ??
        200
    );

    // 空间索引管理
    const { spatialIndex } = useSpatialIndex({
      nodes: nodesRef,
      enabled: enableViewportCullingRef
    });

    // 视口裁剪
    const { visibleNodes } = useViewportCulling({
      nodes: nodesRef,
      viewport: cullingViewportRef,
      enabled: enableViewportCullingRef,
      buffer: viewportCullingBuffer.value,
      spatialIndex,
      spatialIndexThreshold: PERFORMANCE_CONSTANTS.SPATIAL_INDEX_THRESHOLD,
      isPanning: isPanningRef
    });

    // 节点状态管理
    const { getNodeState } = useNodeState({
      nodes: nodesRef,
      selectedNodeIds: selectedNodeIdsRef,
      lockedNodeIds: lockedNodeIdsRef,
      draggingNodeId: draggingNodeIdRef
    });

    // 节点样式管理
    const { getNodeStyle } = useNodeStyle({
      nodes: nodesRef,
      selectedNodeIds: selectedNodeIdsRef,
      draggingNodeId: draggingNodeIdRef,
      elevatedNodeIds: elevatedNodeIdsRef,
      allocateZIndex: props.allocateZIndex,
      removeZIndex: props.removeZIndex,
      config: configRef,
      viewport: layoutViewportRef
    });

    const handleNodeClick = createNodeEventDelegation(visibleNodes, props.onNodeClick);

    const handleNodeDoubleClick = createNodeEventDelegation(visibleNodes, props.onNodeDoubleClick);

    const handleNodeMouseDown = createNodeEventDelegation(
      visibleNodes,
      props.onNodeMouseDown,
      { excludeSelector: '.flow-handle' } // 排除端口点击
    );

    const containerStyle: CSSProperties = {
      position: 'relative',
      width: '100%',
      height: '100%',
      pointerEvents: 'none'
    };

    // ==================== 性能监控 ====================
    let renderCount = 0;

    return () => {
      const renderStart = performance.now();
      const nodeCount = visibleNodes.value.length;
      renderCount += 1;

      const nodesStart = performance.now();

      // 渲染节点列表
      const nodes = visibleNodes.value.map((node: FlowNode) => {
        const state = getNodeState(node);
        const style = getNodeStyle(node);

        return (
          <div key={node.id} data-node-id={node.id} style={style}>
            <BaseNode
              node={node}
              selected={state.selected}
              locked={state.locked}
              hovered={state.hovered}
              dragging={state.dragging}
              onPortMousedown={props.onPortMouseDown}
              onPortMouseup={props.onPortMouseUp}
              onPortMouseenter={props.onPortMouseEnter}
              onPortMouseleave={props.onPortMouseLeave}
            />
          </div>
        );
      });

      const nodesTime = performance.now() - nodesStart;
      const renderTime = performance.now() - renderStart;

      // 性能监控
      performanceMonitor.record('nodesRender', renderTime, {
        nodeCount,
        isPanning: isPanningRef.value,
        renderCount,
        nodesTime
      });

      return (
        <div
          class="flow-nodes"
          style={containerStyle}
          onClick={props.onNodeClick ? handleNodeClick : undefined}
          onDblclick={props.onNodeDoubleClick ? handleNodeDoubleClick : undefined}
          onMousedown={props.onNodeMouseDown ? handleNodeMouseDown : undefined}
        >
          {nodes}
        </div>
      );
    };
  }
});
