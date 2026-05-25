/**
 * 连接预览线组件
 *
 * 显示正在创建连接时的预览线 复用 BaseEdge 组件，减少重复代码
 */

import { type PropType, computed, defineComponent, ref, watch } from 'vue';
import { getHandlePositionScreen } from '../utils/node-utils';
import { generateEdgePath } from '../utils/edge-path-generator';
import {
  ANIMATION_CONSTANTS,
  EDGE_COLORS,
  ID_PREFIXES,
  MARKER_SUFFIXES
} from '../constants/edge-constants';
import { calculateArrowMarkerConfig } from '../utils/edge-style-utils';
import type { FlowEdge, FlowNode, FlowViewport } from '../types';
import type { EdgePositions } from '../hooks/useEdgePositions';
import BaseEdge from './edges/BaseEdge';

export interface ConnectionPreviewProps {
  /** 源节点 ID */
  sourceNodeId: string;
  /** 源端口 ID */
  sourceHandleId: string;
  /** 预览位置（鼠标位置） */
  previewPos: { x: number; y: number };
  /** 按 ID 查找节点（避免传入完整 nodes 数组触发多余更新） */
  getNodeById: (id: string) => FlowNode | undefined;
  /** 视口状态 */
  viewport: FlowViewport;
  /** 画布容器引用 */
  canvasRef: HTMLElement | null;
}

export default defineComponent({
  name: 'ConnectionPreview',
  props: {
    sourceNodeId: {
      type: String,
      required: true
    },
    sourceHandleId: {
      type: String,
      required: true
    },
    previewPos: {
      type: Object as PropType<{ x: number; y: number }>,
      required: true
    },
    getNodeById: {
      type: Function as PropType<(id: string) => FlowNode | undefined>,
      required: true
    },
    viewport: {
      type: Object as PropType<FlowViewport>,
      required: true
    },
    canvasRef: {
      type: Object as PropType<HTMLElement | null>,
      default: null
    }
  },
  setup(props) {
    const canvasRect = ref<DOMRect | null>(null);

    watch(
      () => props.canvasRef,
      newRef => {
        canvasRect.value = newRef?.getBoundingClientRect() || null;
      },
      { immediate: true }
    );

    const sourceHandlePosition = ref<{ x: number; y: number } | null>(null);

    const updateSourceHandlePosition = () => {
      const sourceNode = props.getNodeById(props.sourceNodeId);
      if (!sourceNode) {
        sourceHandlePosition.value = null;
        return;
      }

      sourceHandlePosition.value = getHandlePositionScreen(
        sourceNode,
        props.sourceHandleId,
        props.viewport
      );
    };

    watch(
      () => [props.sourceNodeId, props.sourceHandleId] as const,
      () => {
        updateSourceHandlePosition();
      },
      { immediate: true }
    );

    watch(
      () => {
        const sourceNode = props.getNodeById(props.sourceNodeId);
        return sourceNode ? [sourceNode.position.x, sourceNode.position.y] : null;
      },
      () => {
        if (props.sourceNodeId && props.sourceHandleId) {
          updateSourceHandlePosition();
        }
      },
      { immediate: false }
    );

    watch(
      () => [props.viewport.x, props.viewport.y, props.viewport.zoom] as const,
      () => {
        updateSourceHandlePosition();
      }
    );

    const arrowMarkerConfig = computed(() => {
      const zoom = Math.round(props.viewport.zoom * 100) / 100;
      return calculateArrowMarkerConfig(zoom);
    });

    const previewData = computed(() => {
      const sourcePos = sourceHandlePosition.value;
      if (!sourcePos) return null;

      const rect = canvasRect.value;
      if (!rect) return null;

      const screenTargetX = props.previewPos.x - rect.left;
      const screenTargetY = props.previewPos.y - rect.top;

      const positions: EdgePositions = {
        sourceX: sourcePos.x,
        sourceY: sourcePos.y,
        targetX: screenTargetX,
        targetY: screenTargetY,
        sourceHandleX: sourcePos.x,
        sourceHandleY: sourcePos.y
      };

      const previewEdge: FlowEdge = {
        id: 'preview',
        source: props.sourceNodeId,
        target: 'preview-target',
        type: 'bezier',
        sourceHandle: props.sourceHandleId,
        showArrow: true
      };

      const path = generateEdgePath(previewEdge, positions, {
        showArrow: true,
        viewport: props.viewport
      });

      return {
        edge: previewEdge,
        positions,
        path
      };
    });

    const previewMarkerId = computed(() => {
      const prefix = `${ID_PREFIXES.ARROW}preview`;
      return `${prefix}${MARKER_SUFFIXES.DEFAULT}`;
    });

    return () => {
      const data = previewData.value;
      if (!data) return null;

      const arrowConfig = arrowMarkerConfig.value;

      return (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: Infinity,
            overflow: 'visible'
          }}
        >
          <defs>
            <marker
              key={`preview-arrow-${arrowConfig.arrowSize}`}
              id={previewMarkerId.value}
              markerWidth={arrowConfig.arrowSize}
              markerHeight={arrowConfig.arrowSize}
              refX={arrowConfig.refX}
              refY={arrowConfig.refY}
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d={arrowConfig.path} fill={EDGE_COLORS.DEFAULT} />
            </marker>
          </defs>

          <BaseEdge
            edge={data.edge}
            sourceX={data.positions.sourceX}
            sourceY={data.positions.sourceY}
            targetX={data.positions.targetX}
            targetY={data.positions.targetY}
            sourceHandleX={data.positions.sourceHandleX}
            sourceHandleY={data.positions.sourceHandleY}
            path={data.path}
            viewport={props.viewport}
            instanceId="preview"
            markerEnd={previewMarkerId.value}
            style={{
              strokeDasharray: ANIMATION_CONSTANTS.DASH_ARRAY
            }}
            class="flow-edge-preview"
          />
        </svg>
      );
    };
  }
});
