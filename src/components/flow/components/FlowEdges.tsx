/**
 * Flow 连接线列表组件
 *
 * 负责渲染所有连接线，支持 Canvas/SVG 混合渲染、视口裁剪等性能优化 重构后：逻辑解耦，性能优化
 */

import {
  type CSSProperties,
  type PropType,
  computed,
  defineComponent,
  ref,
  toRef,
  watch
} from 'vue';
import { PERFORMANCE_CONSTANTS } from '../constants/performance-constants';
import { useEdgePositions } from '../hooks/useEdgePositions';
import { useEdgeViewportCulling } from '../hooks/useEdgeViewportCulling';
import { useFlowCanvasContextOptional } from '../hooks/useFlowCanvasContext';
import type { FlowConfig, FlowEdge, FlowNode, FlowViewport } from '../types';
import { getEdgeClickAreaWidth } from '../utils/edge-interaction-utils';
import { useCachedSet } from '../utils/set-utils';
import EdgeCanvasRenderer from './edges/EdgeCanvasRenderer';
import EdgeSvgRenderer from './edges/EdgeSvgRenderer';

export type { FlowEdgesProps } from '../types/flow-canvas';

/** Flow 连接线列表组件 */
export default defineComponent({
  name: 'FlowEdges',
  props: {
    edges: {
      type: Array as PropType<FlowEdge[]>,
      required: true
    },
    nodes: {
      type: Array as PropType<FlowNode[]>,
      required: true
    },
    selectedEdgeIds: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    viewport: {
      type: Object as PropType<FlowViewport>,
      default: undefined
    },
    instanceId: {
      type: String,
      default: undefined
    },
    enableViewportCulling: {
      type: Boolean,
      default: undefined
    },
    enableCanvasRendering: {
      type: Boolean,
      default: undefined
    },
    canvasThreshold: {
      type: Number,
      default: undefined
    },
    onEdgeClick: {
      type: Function as PropType<(edge: FlowEdge, event: MouseEvent) => void>,
      default: undefined
    },
    onEdgeDoubleClick: {
      type: Function as PropType<(edge: FlowEdge, event: MouseEvent) => void>,
      default: undefined
    },
    onEdgeMouseEnter: {
      type: Function as PropType<(edge: FlowEdge, event: MouseEvent) => void>,
      default: undefined
    },
    onEdgeMouseLeave: {
      type: Function as PropType<(edge: FlowEdge, event: MouseEvent) => void>,
      default: undefined
    },
    onEdgeDelete: {
      type: Function as PropType<(edge: FlowEdge, event: MouseEvent) => void>,
      default: undefined
    },
    onEdgeEndpointMouseDown: {
      type: Function as PropType<
        (edge: FlowEdge, endpoint: 'source' | 'target', event: MouseEvent) => void
      >,
      default: undefined
    },
    config: {
      type: Object as PropType<Readonly<FlowConfig>>,
      default: undefined
    },
    isPanning: {
      type: Boolean,
      default: undefined
    },
    draggingNodeId: {
      type: String as PropType<string | null>,
      default: undefined
    }
  },
  setup(props) {
    const canvasCtx = useFlowCanvasContextOptional();

    const edgesRef = toRef(props, 'edges');
    const nodesRef = toRef(props, 'nodes');
    const defaultViewport = { x: 0, y: 0, zoom: 1 };

    /** 平移时冻结，用于视口裁剪与平移中的路径基准 */
    const cullingViewportRef = computed(
      () => props.viewport ?? canvasCtx?.stableViewport.value ?? defaultViewport
    );
    /** 实时视口（平移时仅用于 CSS 偏移，避免每帧重算全部边） */
    const liveViewportRef = computed(
      () => props.viewport ?? canvasCtx?.viewport.value ?? defaultViewport
    );
    const isPanningRef = computed(() => props.isPanning ?? canvasCtx?.isPanning.value ?? false);

    /** 非平移时用实时视口；平移时用冻结视口 + panLayer 的 translate 与节点对齐 */
    const edgePositionViewportRef = computed(() =>
      isPanningRef.value ? cullingViewportRef.value : liveViewportRef.value
    );

    const panLayerStyle = computed((): CSSProperties | undefined => {
      if (!isPanningRef.value) {
        return undefined;
      }
      const stable = cullingViewportRef.value;
      const live = liveViewportRef.value;
      const dx = live.x - stable.x;
      const dy = live.y - stable.y;
      if (dx === 0 && dy === 0) {
        return undefined;
      }
      return {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transform: `translate3d(${dx}px, ${dy}px, 0)`,
        willChange: 'transform',
        pointerEvents: 'none'
      };
    });

    const configRef = computed(() => props.config ?? canvasCtx?.config.value);
    const enableViewportCulling = computed(
      () =>
        props.enableViewportCulling ??
        canvasCtx?.config.value.performance?.enableViewportCulling ??
        true
    );
    const enableCanvasRendering = computed(
      () =>
        props.enableCanvasRendering ??
        canvasCtx?.config.value.performance?.enableEdgeCanvasRendering ??
        false
    );
    const canvasThreshold = computed(
      () => props.canvasThreshold ?? canvasCtx?.config.value.performance?.edgeCanvasThreshold ?? 200
    );

    const resolvedDraggingNodeId = computed(
      () => props.draggingNodeId ?? canvasCtx?.draggingNodeId.value ?? null
    );

    const draggingNodeIds = ref(new Set<string>());
    watch(
      resolvedDraggingNodeId,
      id => {
        draggingNodeIds.value = id ? new Set([id]) : new Set();
      },
      { immediate: true }
    );

    const selectedEdgeIdsRef = computed(() => props.selectedEdgeIds || []);
    const selectedEdgeIdsSet = useCachedSet(selectedEdgeIdsRef);

    const defaultInstanceId = computed(
      () => props.instanceId ?? canvasCtx?.instanceId.value ?? 'default'
    );

    const { visibleEdges } = useEdgeViewportCulling({
      edges: edgesRef,
      nodes: nodesRef,
      viewport: cullingViewportRef,
      enabled: enableViewportCulling.value !== false,
      isPanning: isPanningRef,
      canvasSize: canvasCtx?.canvasSize
    });

    // 位置计算
    const { getEdgePositions } = useEdgePositions({
      edges: edgesRef,
      nodes: nodesRef,
      viewport: edgePositionViewportRef,
      draggingNodeIds
    });

    // 是否使用 Canvas 渲染（基于可见边数量）
    const useCanvas = computed(() => {
      return enableCanvasRendering.value && visibleEdges.value.length >= canvasThreshold.value;
    });

    const edgeZIndex = computed(() => {
      const renderBehindNodes = configRef.value?.edges?.renderBehindNodes !== false;
      return renderBehindNodes
        ? PERFORMANCE_CONSTANTS.Z_INDEX_EDGE
        : PERFORMANCE_CONSTANTS.Z_INDEX_NODE_BASE + 1;
    });

    const renderSelectedEdgesOnTop = computed(
      () => configRef.value?.edges?.renderBehindNodes !== false
    );

    const selectedEdgeFrontZIndex = PERFORMANCE_CONSTANTS.Z_INDEX_EDGE_SELECTED;

    const clickAreaWidth = computed(() => getEdgeClickAreaWidth(configRef.value));

    const selectedVisibleEdges = computed(() =>
      renderSelectedEdgesOnTop.value
        ? visibleEdges.value.filter(edge => selectedEdgeIdsSet.value.has(edge.id))
        : []
    );

    const hoveredEdgeId = ref<string | null>(null);
    const visibleEdgesRef = computed(() => visibleEdges.value);

    const findEdgeById = (id: string): FlowEdge | undefined =>
      visibleEdgesRef.value.find(e => e.id === id) ?? edgesRef.value.find(e => e.id === id);

    const handleEdgePointerOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const edgeEl = target.closest('[data-edge-id]');
      if (!edgeEl) {
        return;
      }
      const id = edgeEl.getAttribute('data-edge-id');
      if (!id || hoveredEdgeId.value === id) {
        return;
      }
      const prevId = hoveredEdgeId.value;
      hoveredEdgeId.value = id;
      const edge = findEdgeById(id);
      if (edge) {
        props.onEdgeMouseEnter?.(edge, event);
      }
      if (prevId) {
        const prevEdge = findEdgeById(prevId);
        if (prevEdge) {
          props.onEdgeMouseLeave?.(prevEdge, event);
        }
      }
    };

    const handleEdgePointerOut = (event: MouseEvent) => {
      const related = event.relatedTarget as HTMLElement | null;
      if (related?.closest('[data-edge-id]')) {
        return;
      }
      const id = hoveredEdgeId.value;
      if (!id) {
        return;
      }
      hoveredEdgeId.value = null;
      const edge = findEdgeById(id);
      if (edge) {
        props.onEdgeMouseLeave?.(edge, event);
      }
    };

    const renderEdgeLayer = (options: {
      edges: FlowEdge[];
      zIndex: number;
      interactionOnly?: boolean;
      visualOnly?: boolean;
      hitOnlySelected?: boolean;
      enableHover?: boolean;
      useCanvasRendering?: boolean;
    }) => {
      const {
        edges: layerEdges,
        zIndex,
        interactionOnly = false,
        visualOnly = false,
        hitOnlySelected = false,
        enableHover = true,
        useCanvasRendering = false
      } = options;

      if (layerEdges.length === 0) {
        return null;
      }

      const edgeViewport = edgePositionViewportRef.value;

      const sharedProps = {
        visibleEdges: layerEdges,
        getEdgePositions,
        selectedEdgeIdsSet: selectedEdgeIdsSet.value,
        viewport: edgeViewport,
        instanceId: defaultInstanceId.value,
        zIndex,
        clickAreaWidth: clickAreaWidth.value,
        config: configRef.value,
        bezierControlOffset: configRef.value?.edges?.bezierControlOffset,
        onEdgeClick: props.onEdgeClick,
        onEdgeDoubleClick: props.onEdgeDoubleClick,
        onEdgeMouseEnter: props.onEdgeMouseEnter,
        onEdgeMouseLeave: props.onEdgeMouseLeave,
        onEdgeDelete: props.onEdgeDelete,
        onEdgeEndpointMouseDown: props.onEdgeEndpointMouseDown
      };

      if (useCanvasRendering && !interactionOnly) {
        return (
          <EdgeCanvasRenderer
            visibleEdges={layerEdges}
            getEdgePositions={getEdgePositions}
            selectedEdgeIdsSet={selectedEdgeIdsSet.value}
            viewport={edgeViewport}
            zIndex={zIndex}
          />
        );
      }

      return (
        <EdgeSvgRenderer
          {...sharedProps}
          interactionOnly={interactionOnly}
          visualOnly={visualOnly}
          hitOnlySelected={hitOnlySelected}
          hoveredEdgeId={enableHover ? hoveredEdgeId.value : null}
          onEdgePointerOver={enableHover ? handleEdgePointerOver : undefined}
          onEdgePointerOut={enableHover ? handleEdgePointerOut : undefined}
        />
      );
    };

    return () => {
      const layerStyle = panLayerStyle.value;
      const elevateSelected = renderSelectedEdgesOnTop.value;

      const backLayer = renderEdgeLayer({
        edges: visibleEdges.value,
        zIndex: edgeZIndex.value,
        hitOnlySelected: elevateSelected,
        useCanvasRendering: useCanvas.value
      });

      const selectedVisualLayer =
        elevateSelected &&
        renderEdgeLayer({
          edges: selectedVisibleEdges.value,
          zIndex: selectedEdgeFrontZIndex,
          visualOnly: true,
          enableHover: false
        });

      const canvasHitLayer =
        useCanvas.value &&
        renderEdgeLayer({
          edges: visibleEdges.value,
          zIndex: edgeZIndex.value,
          interactionOnly: true,
          enableHover: false
        });

      const edgeContent = (
        <>
          {backLayer}
          {selectedVisualLayer}
          {canvasHitLayer}
        </>
      );

      if (!layerStyle) {
        return edgeContent;
      }

      return (
        <div class="flow-edges-pan-layer" style={layerStyle}>
          {edgeContent}
        </div>
      );
    };
  }
});
