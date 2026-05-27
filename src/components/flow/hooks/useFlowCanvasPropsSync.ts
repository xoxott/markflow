/**
 * FlowCanvas Props 同步 Hook
 *
 * 负责将外部传入的 props 同步到内部状态管理系统
 */

import { type ComputedRef, type Ref, type WatchStopHandle, watch } from 'vue';
import { compareIds } from '../utils/array-utils';
import type { FlowEdge, FlowNode } from '../types';
import type { IStateStore } from '../core/state/interfaces/IStateStore';
import type { FlowViewport } from '../types/flow-config';
import type { FlowGuideLine } from '../types/flow-guide';

/** FlowCanvas Props 同步 Hook 选项 */
export interface UseFlowCanvasPropsSyncOptions {
  /** 外部传入的节点列表（受控 `nodes` 优先，否则 `initialNodes`） */
  nodesSource?:
    | Ref<FlowNode[] | undefined>
    | ComputedRef<FlowNode[] | undefined>
    | (() => FlowNode[] | undefined);
  /** 外部传入的连接线列表（受控 `edges` 优先，否则 `initialEdges`） */
  edgesSource?:
    | Ref<FlowEdge[] | undefined>
    | ComputedRef<FlowEdge[] | undefined>
    | (() => FlowEdge[] | undefined);
  /** 受控视口 */
  viewportSource?:
    | Ref<FlowViewport | undefined>
    | ComputedRef<FlowViewport | undefined>
    | (() => FlowViewport | undefined);
  /** 受控选区 */
  selectionSource?:
    | Ref<{ nodeIds: string[]; edgeIds: string[] } | undefined>
    | ComputedRef<{ nodeIds: string[]; edgeIds: string[] } | undefined>
    | (() => { nodeIds: string[]; edgeIds: string[] } | undefined);
  /** 受控辅助线 */
  guidesSource?:
    | Ref<FlowGuideLine[] | undefined>
    | ComputedRef<FlowGuideLine[] | undefined>
    | (() => FlowGuideLine[] | undefined);
  /** @deprecated 使用 nodesSource */
  initialNodes?:
    | Ref<FlowNode[] | undefined>
    | ComputedRef<FlowNode[] | undefined>
    | (() => FlowNode[] | undefined);
  /** @deprecated 使用 edgesSource */
  initialEdges?:
    | Ref<FlowEdge[] | undefined>
    | ComputedRef<FlowEdge[] | undefined>
    | (() => FlowEdge[] | undefined);
  /** 内部状态存储实例 */
  stateStore: IStateStore;
  /** 内部节点列表（用于比较） */
  nodes: Ref<FlowNode[]>;
  /** 内部连接线列表（用于比较） */
  edges: Ref<FlowEdge[]>;
  /** 内部视口 */
  viewport?: Ref<FlowViewport>;
  /** 设置视口 */
  setViewport?: (viewport: Partial<FlowViewport>) => void;
  /** 设置选区 */
  setSelection?: (nodeIds: string[], edgeIds: string[]) => void;
  /** 设置辅助线 */
  setGuides?: (guides: FlowGuideLine[]) => void;
}

/** FlowCanvas Props 同步 Hook 返回值 */
export interface UseFlowCanvasPropsSyncReturn {
  /** 开始同步（通常在组件挂载后调用） */
  start: () => void;
  /** 停止同步（通常在组件卸载时调用） */
  stop: () => void;
}

/** 创建同步监听器 */
function createSyncWatcher<T extends { id: string }>(
  source: Ref<T[] | undefined> | ComputedRef<T[] | undefined> | (() => T[] | undefined),
  current: Ref<T[]>,
  setter: (items: T[]) => void
): WatchStopHandle {
  return watch(source, newItems => {
    // 注意：必须支持显式清空（newItems = []）的场景；
    // 旧实现要求 `newItems.length > 0` 会导致外部把节点全部删空时内部状态不同步。
    if (!newItems) {
      return;
    }
    if (!compareIds(current.value, newItems)) {
      setter(newItems);
    }
  });
}

/**
 * FlowCanvas Props 同步 Hook
 *
 * 监听外部 props 变化，同步到内部状态管理系统
 *
 * @example
 *   ```typescript
 *   const { start, stop } = useFlowCanvasPropsSync({
 *     initialNodes: computed(() => props.initialNodes),
 *     initialEdges: computed(() => props.initialEdges),
 *     stateStore,
 *     nodes,
 *     edges
 *   });
 *
 *   onMounted(() => start());
 *   onUnmounted(() => stop());
 *   ```;
 *
 * @param options Hook 选项
 * @returns 同步控制方法
 */
export function useFlowCanvasPropsSync(
  options: UseFlowCanvasPropsSyncOptions
): UseFlowCanvasPropsSyncReturn {
  const {
    nodesSource,
    edgesSource,
    viewportSource,
    selectionSource,
    guidesSource,
    initialNodes,
    initialEdges,
    stateStore,
    nodes,
    edges,
    viewport,
    setViewport,
    setSelection,
    setGuides
  } = options;

  const resolvedNodesSource = nodesSource ?? initialNodes;
  const resolvedEdgesSource = edgesSource ?? initialEdges;

  const watchers: WatchStopHandle[] = [];

  const start = () => {
    if (resolvedNodesSource) {
      watchers.push(
        createSyncWatcher(resolvedNodesSource, nodes, newNodes => stateStore.setNodes(newNodes))
      );
    }

    if (resolvedEdgesSource) {
      watchers.push(
        createSyncWatcher(resolvedEdgesSource, edges, newEdges => stateStore.setEdges(newEdges))
      );
    }

    if (viewportSource && viewport && setViewport) {
      watchers.push(
        watch(viewportSource, next => {
          if (next) {
            setViewport(next);
          }
        })
      );
    }

    if (selectionSource && setSelection) {
      watchers.push(
        watch(
          selectionSource,
          next => {
            if (next) {
              setSelection(next.nodeIds, next.edgeIds);
            }
          },
          { deep: true }
        )
      );
    }

    if (guidesSource && setGuides) {
      watchers.push(
        watch(guidesSource, next => {
          if (next) {
            setGuides(next);
          }
        })
      );
    }
  };

  const stop = () => {
    watchers.forEach(watcherStop => watcherStop());
    watchers.length = 0;
  };

  return { start, stop };
}
