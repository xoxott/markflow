/**
 * 连接线 SVG 渲染器组件
 *
 * 负责使用 SVG 渲染连接线，支持贝塞尔曲线和箭头
 */

import type { CSSProperties, PropType } from 'vue';
import { computed, defineComponent, withMemo } from 'vue';
import { getGpuAccelerationStyle } from '../../utils/style-utils';
import { useEventHandlers } from '../../hooks/useEventHandlers';
import { generateEdgePath } from '../../utils/edge-path-generator';
import type { FlowConfig, FlowEdge, FlowViewport } from '../../types';
import type { EdgePositions } from '../../hooks/useEdgePositions';
import {
  EDGE_CLASS_NAMES,
  EDGE_CSS_VARS,
  ID_PREFIXES,
  MARKER_PATH_SUFFIXES,
  MARKER_SUFFIXES
} from '../../constants/edge-constants';
import { calculateArrowMarkerConfig } from '../../utils/edge-style-utils';
import {
  getEdgeClickAreaWidth,
  getEdgeDeleteButtonSize,
  isEdgeSelectable,
  shouldShowEdgeDeleteButton
} from '../../utils/edge-interaction-utils';
import BaseEdge from './BaseEdge';

/** EdgeSvgRenderer 组件属性 */
export interface EdgeSvgRendererProps {
  /** 可见连接线列表 */
  visibleEdges: FlowEdge[];
  /** 连接线位置计算函数 */
  getEdgePositions: (edge: FlowEdge) => EdgePositions | null;
  /** 选中的连接线 ID 集合 */
  selectedEdgeIdsSet: Set<string>;
  /** 视口状态 */
  viewport: FlowViewport;
  /** 实例 ID（用于生成唯一的 SVG ID） */
  instanceId: string;
  /** 连接线点击事件 */
  onEdgeClick?: (edge: FlowEdge, event: MouseEvent) => void;
  /** 连接线双击事件 */
  onEdgeDoubleClick?: (edge: FlowEdge, event: MouseEvent) => void;
  /** 连接线鼠标进入 */
  onEdgeMouseEnter?: (edge: FlowEdge, event: MouseEvent) => void;
  /** 连接线鼠标离开 */
  onEdgeMouseLeave?: (edge: FlowEdge, event: MouseEvent) => void;
  /** 连接线删除（点击删除按钮） */
  onEdgeDelete?: (edge: FlowEdge, event: MouseEvent) => void;
  /** 当前悬停的边 ID */
  hoveredEdgeId?: string | null;
  /** SVG 容器 pointerover（边 hover 委托） */
  onEdgePointerOver?: (event: MouseEvent) => void;
  /** SVG 容器 pointerout（边 hover 委托） */
  onEdgePointerOut?: (event: MouseEvent) => void;
}

/** 连接线 SVG 渲染器组件 */
export default defineComponent({
  name: 'EdgeSvgRenderer',
  props: {
    visibleEdges: {
      type: Array as PropType<FlowEdge[]>,
      required: true
    },
    getEdgePositions: {
      type: Function as PropType<(edge: FlowEdge) => EdgePositions | null>,
      required: true
    },
    selectedEdgeIdsSet: {
      type: Object as PropType<Set<string>>,
      required: true
    },
    viewport: {
      type: Object as PropType<FlowViewport>,
      required: true
    },
    instanceId: {
      type: String,
      required: true
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
    zIndex: {
      type: Number,
      default: 0
    },
    bezierControlOffset: {
      type: Number,
      default: 0.5
    },
    clickAreaWidth: {
      type: Number,
      default: undefined
    },
    /** 仅渲染透明命中层（配合 Canvas 视觉层） */
    interactionOnly: {
      type: Boolean,
      default: false
    },
    /** 选中边的视觉浮层（无命中区，不挡节点） */
    visualOnly: {
      type: Boolean,
      default: false
    },
    /** 本层内：已选中的边只保留命中区（命中区留在节点下方） */
    hitOnlySelected: {
      type: Boolean,
      default: false
    },
    hoveredEdgeId: {
      type: String as PropType<string | null>,
      default: null
    },
    onEdgePointerOver: {
      type: Function as PropType<(event: MouseEvent) => void>,
      default: undefined
    },
    onEdgePointerOut: {
      type: Function as PropType<(event: MouseEvent) => void>,
      default: undefined
    },
    config: {
      type: Object as PropType<Readonly<FlowConfig>>,
      default: undefined
    }
  },
  setup(props) {
    const idPrefix = computed(() => `${ID_PREFIXES.ARROW}${props.instanceId}`);
    const zoom = computed(() => props.viewport?.zoom ?? 1);
    const resolvedClickAreaWidth = computed(
      () => props.clickAreaWidth ?? getEdgeClickAreaWidth(props.config)
    );
    const resolvedDeleteButtonSize = computed(() => getEdgeDeleteButtonSize(props.config));

    // 使用工具函数计算箭头标记配置
    const arrowConfig = computed(() => calculateArrowMarkerConfig(zoom.value));

    // GPU 加速样式
    const svgStyle = computed<CSSProperties>(() => ({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'visible',
      // 容器不拦截事件，仅边/删除按钮自身响应（避免选中层盖住节点）
      pointerEvents: 'none',
      zIndex: props.zIndex,
      ...getGpuAccelerationStyle({
        enabled: true,
        includeBackfaceVisibility: true,
        includePerspective: true
      })
    }));

    const { eventHandlers } = useEventHandlers({
      items: computed(() => props.visibleEdges),
      getId: edge => edge.id,
      handlers: {
        onClick: props.onEdgeClick,
        onDoubleClick: props.onEdgeDoubleClick,
        onMouseEnter: props.onEdgeMouseEnter,
        onMouseLeave: props.onEdgeMouseLeave
      }
    });

    const edgeMemoCache: unknown[] = [];

    return () => {
      const handlers = eventHandlers.value;

      return (
        <svg
          class={[
            EDGE_CLASS_NAMES.CONTAINER,
            props.interactionOnly && 'flow-edges-interaction-layer'
          ]}
          style={svgStyle.value}
          onMouseover={props.interactionOnly ? undefined : props.onEdgePointerOver}
          onMouseout={props.interactionOnly ? undefined : props.onEdgePointerOut}
        >
          {!props.interactionOnly && (
            <>
              {/* 共享的箭头标记定义 */}
              <defs>
                {/* 共享的箭头路径定义 */}
                <path
                  id={`${idPrefix.value}${MARKER_PATH_SUFFIXES.DEFAULT}`}
                  d={arrowConfig.value.path}
                  fill={EDGE_CSS_VARS.DEFAULT}
                />
                <path
                  id={`${idPrefix.value}${MARKER_PATH_SUFFIXES.SELECTED}`}
                  d={arrowConfig.value.path}
                  fill={EDGE_CSS_VARS.SELECTED}
                />
                <path
                  id={`${idPrefix.value}${MARKER_PATH_SUFFIXES.HOVERED}`}
                  d={arrowConfig.value.path}
                  fill={EDGE_CSS_VARS.HOVERED}
                />

                {/* 箭头标记 */}
                <marker
                  id={`${idPrefix.value}${MARKER_SUFFIXES.DEFAULT}`}
                  markerWidth={arrowConfig.value.arrowSize}
                  markerHeight={arrowConfig.value.arrowSize}
                  refX={arrowConfig.value.refX}
                  refY={arrowConfig.value.refY}
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <use href={`#${idPrefix.value}${MARKER_PATH_SUFFIXES.DEFAULT}`} />
                </marker>

                <marker
                  id={`${idPrefix.value}${MARKER_SUFFIXES.SELECTED}`}
                  markerWidth={arrowConfig.value.arrowSize}
                  markerHeight={arrowConfig.value.arrowSize}
                  refX={arrowConfig.value.refX}
                  refY={arrowConfig.value.refY}
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <use href={`#${idPrefix.value}${MARKER_PATH_SUFFIXES.SELECTED}`} />
                </marker>

                <marker
                  id={`${idPrefix.value}${MARKER_SUFFIXES.HOVERED}`}
                  markerWidth={arrowConfig.value.arrowSize}
                  markerHeight={arrowConfig.value.arrowSize}
                  refX={arrowConfig.value.refX}
                  refY={arrowConfig.value.refY}
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <use href={`#${idPrefix.value}${MARKER_PATH_SUFFIXES.HOVERED}`} />
                </marker>
              </defs>
            </>
          )}

          {/* 渲染连接线 */}
          {props.visibleEdges.map((edge, index) => {
            const positions = props.getEdgePositions(edge);
            if (!positions) {
              return null;
            }

            const isSelected = props.selectedEdgeIdsSet.has(edge.id);
            const isHovered = props.hoveredEdgeId === edge.id;
            const edgeInteractionOnly =
              props.interactionOnly || (props.hitOnlySelected && isSelected);
            const edgeVisualOnly = props.visualOnly;
            const path = generateEdgePath(edge, positions, {
              showArrow: edge.showArrow !== false,
              viewport: props.viewport,
              bezierControlOffset: props?.bezierControlOffset
            });

            const handler = handlers?.get(edge.id);
            const memoKey = [
              edge.id,
              isSelected,
              isHovered,
              edgeInteractionOnly,
              edgeVisualOnly,
              path,
              positions.sourceX,
              positions.sourceY,
              positions.targetX,
              positions.targetY,
              positions.sourceHandleX,
              positions.sourceHandleY,
              positions.targetHandleX,
              positions.targetHandleY,
              props.viewport.zoom
            ];

            return withMemo(
              memoKey,
              () => (
                <BaseEdge
                  key={edge.id}
                  edge={edge}
                  sourceX={positions.sourceX}
                  sourceY={positions.sourceY}
                  targetX={positions.targetX}
                  targetY={positions.targetY}
                  sourceHandleX={positions.sourceHandleX}
                  sourceHandleY={positions.sourceHandleY}
                  targetHandleX={positions.targetHandleX}
                  targetHandleY={positions.targetHandleY}
                  path={path}
                  viewport={props.viewport}
                  instanceId={props.instanceId}
                  selected={isSelected}
                  hovered={isHovered}
                  clickAreaWidth={resolvedClickAreaWidth.value}
                  deleteButtonSize={resolvedDeleteButtonSize.value}
                  interactionOnly={edgeInteractionOnly}
                  visualOnly={edgeVisualOnly}
                  interactive={isEdgeSelectable(edge, props.config)}
                  showDeleteButton={
                    shouldShowEdgeDeleteButton(edge, props.config) &&
                    isSelected &&
                    !edgeInteractionOnly
                  }
                  config={props.config}
                  onClick={handler?.onClick}
                  onDouble-click={handler?.onDoubleClick}
                  onMouseenter={handler?.onMouseEnter}
                  onMouseleave={handler?.onMouseLeave}
                  onDelete={(event: MouseEvent) => props.onEdgeDelete?.(edge, event)}
                />
              ),
              edgeMemoCache,
              index
            );
          })}
        </svg>
      );
    };
  }
});
