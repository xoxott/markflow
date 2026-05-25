/**
 * 连接线视口裁剪 Hook
 *
 * 与 useViewportCulling 对齐：shallowRef 稳定列表、pan 时 RAF 节流、可见 ID 集合相等时跳过更新
 */

import { type Ref, computed, shallowRef, watch } from 'vue';
import { getNodeCenterScreen } from '../utils/node-utils';
import type { FlowEdge, FlowNode, FlowViewport } from '../types';
import { isBoolean, isFunction } from '../utils/type-utils';
import { useNodesMap } from './useNodesMap';
import { useRafThrottle } from './useRafThrottle';

/** 连接线视口裁剪 Hook 选项 */
export interface UseEdgeViewportCullingOptions {
  /** 连接线列表 */
  edges: Ref<FlowEdge[]>;
  /** 节点列表 */
  nodes: Ref<FlowNode[]>;
  /** 视口状态（平移时建议使用 stableViewport） */
  viewport: Ref<FlowViewport>;
  /** 是否启用视口裁剪 */
  enabled?: boolean | Ref<boolean> | (() => boolean);
  /** 是否正在平移画布 */
  isPanning?: Ref<boolean>;
}

/** 连接线视口裁剪 Hook 返回值 */
export interface UseEdgeViewportCullingReturn {
  /** 可见连接线列表（稳定引用） */
  visibleEdges: Ref<FlowEdge[]>;
}

function isEdgeInViewport(
  edge: FlowEdge,
  nodesMap: Map<string, FlowNode>,
  viewport: FlowViewport
): boolean {
  const sourceNode = nodesMap.get(edge.source);
  const targetNode = nodesMap.get(edge.target);

  if (!sourceNode || !targetNode) {
    return false;
  }

  const screenWidth = window.innerWidth || 1000;
  const screenHeight = window.innerHeight || 1000;
  const viewportMinX = 0;
  const viewportMaxX = screenWidth;
  const viewportMinY = 0;
  const viewportMaxY = screenHeight;

  const sourceCenter = getNodeCenterScreen(sourceNode, viewport);
  const targetCenter = getNodeCenterScreen(targetNode, viewport);

  const sourceInViewport =
    sourceCenter.x >= viewportMinX &&
    sourceCenter.x <= viewportMaxX &&
    sourceCenter.y >= viewportMinY &&
    sourceCenter.y <= viewportMaxY;

  const targetInViewport =
    targetCenter.x >= viewportMinX &&
    targetCenter.x <= viewportMaxX &&
    targetCenter.y >= viewportMinY &&
    targetCenter.y <= viewportMaxY;

  if (sourceInViewport || targetInViewport) {
    return true;
  }

  const sourceLeft = sourceCenter.x < viewportMinX;
  const sourceRight = sourceCenter.x > viewportMaxX;
  const targetLeft = targetCenter.x < viewportMinX;
  const targetRight = targetCenter.x > viewportMaxX;

  return (
    (sourceLeft && targetRight) ||
    (sourceRight && targetLeft) ||
    (sourceCenter.y < viewportMinY && targetCenter.y > viewportMaxY) ||
    (sourceCenter.y > viewportMaxY && targetCenter.y < viewportMinY)
  );
}

/** 连接线视口裁剪 Hook */
export function useEdgeViewportCulling(
  options: UseEdgeViewportCullingOptions
): UseEdgeViewportCullingReturn {
  const { edges, nodes, viewport, enabled = true, isPanning } = options;

  const nodesRef = computed(() => nodes.value);
  const { nodesMap } = useNodesMap({ nodes: nodesRef });

  const visibleEdgesRef = shallowRef<FlowEdge[]>([]);
  const lastVisibleEdgeIds = new Set<string>();

  const enabledRef = computed(() => {
    if (enabled === undefined) return true;
    if (isBoolean(enabled)) return enabled;
    if (isFunction(enabled)) return enabled();
    return enabled.value;
  });

  const areEdgeIdSetsEqual = (ids1: Set<string>, ids2: Set<string>): boolean => {
    if (ids1.size !== ids2.size) return false;
    for (const id of ids1) {
      if (!ids2.has(id)) return false;
    }
    return true;
  };

  const calculateVisibleEdges = (): FlowEdge[] => {
    if (!enabledRef.value) {
      return edges.value;
    }

    const map = nodesMap.value;
    const vp = viewport.value;

    return edges.value.filter(edge => isEdgeInViewport(edge, map, vp));
  };

  const updateVisibleEdges = () => {
    const newVisibleEdges = calculateVisibleEdges();
    const newIds = new Set(newVisibleEdges.map(e => e.id));

    const idsChanged = !areEdgeIdSetsEqual(newIds, lastVisibleEdgeIds);
    const edgesRefChanged =
      idsChanged ||
      visibleEdgesRef.value.length !== newVisibleEdges.length ||
      visibleEdgesRef.value.some((edge, index) => edge !== newVisibleEdges[index]);

    if (edgesRefChanged) {
      visibleEdgesRef.value = newVisibleEdges;
      lastVisibleEdgeIds.clear();
      newIds.forEach(id => lastVisibleEdgeIds.add(id));
    }
  };

  const { throttled: throttledUpdateVisibleEdges, cancel: cancelThrottledUpdate } = useRafThrottle(
    updateVisibleEdges,
    { immediate: false }
  );

  watch(
    () => [edges.value, nodes.value, enabledRef.value] as const,
    () => {
      cancelThrottledUpdate();
      updateVisibleEdges();
    },
    { immediate: true, deep: false }
  );

  watch(
    () => {
      const vp = viewport.value;
      if (!vp) return [0, 0, 1] as const;
      return [vp.x, vp.y, vp.zoom] as const;
    },
    () => {
      if (isPanning?.value) {
        throttledUpdateVisibleEdges();
      } else {
        cancelThrottledUpdate();
        updateVisibleEdges();
      }
    },
    { immediate: false, deep: false }
  );

  if (isPanning) {
    watch(
      () => isPanning.value,
      (isPanningNow, wasPanning) => {
        if (wasPanning === true && !isPanningNow) {
          cancelThrottledUpdate();
          updateVisibleEdges();
        }
      }
    );
  }

  return {
    visibleEdges: visibleEdgesRef
  };
}
