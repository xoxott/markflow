/**
 * Z-index 分配器 Hook
 *
 * 用于管理节点的 z-index 分配，支持递增分配和自动清理
 */

import { type Ref, shallowRef, triggerRef } from 'vue';
import { PERFORMANCE_CONSTANTS } from '../constants/performance-constants';

export interface UseZIndexAllocatorOptions {
  /** z-index 起始值，默认从 Z_INDEX_BASE 开始 */
  startValue?: number;
  /** 最大保留的节点数量，默认 50 */
  maxNodes?: number;
}

export interface UseZIndexAllocatorReturn {
  /** 已分配 z-index 的节点 ID 映射（节点 ID -> z-index 值） */
  allocatedZIndexes: Ref<Map<string, number>>;
  /** 分配递增的 z-index */
  allocate: (nodeId: string) => number;
  /** 移除节点的 z-index */
  remove: (nodeId: string) => void;
  /** 清除所有分配的 z-index */
  clear: () => void;
}

/**
 * Z-index 分配器 Hook
 *
 * 提供递增的 z-index 分配功能，自动管理节点层级，支持自动清理最旧的节点
 *
 * @example
 *   ```typescript
 *   const { allocatedZIndexes, allocate, remove } = useZIndexAllocator({
 *     startValue: 1000,
 *     maxNodes: 50
 *   });
 *
 *   // 分配 z-index
 *   const zIndex = allocate('node-1');
 *
 *   // 移除 z-index
 *   remove('node-1');
 *   ```;
 *
 * @param options 配置选项
 * @returns Z-index 分配相关的状态和方法
 */
export function useZIndexAllocator(
  options: UseZIndexAllocatorOptions = {}
): UseZIndexAllocatorReturn {
  const { startValue = PERFORMANCE_CONSTANTS.Z_INDEX_BASE, maxNodes = 50 } = options;

  /**
   * 已分配 z-index 的节点 ID 映射
   *
   * 用 `shallowRef` 避免 Vue 对 Map 进行深层 Proxy： 一方面 `Map.get(id)` 在 computed 里被追踪会让任意节点 z-index
   * 变化都触发全量重算， 另一方面频繁的 Proxy 转发也是无意义开销。 修改后通过 `triggerRef` 显式触发响应式更新即可。
   */
  const allocatedZIndexes: Ref<Map<string, number>> = shallowRef(new Map<string, number>());

  /** 层级计数器（用于分配递增的 z-index） */
  let counter = startValue;

  /**
   * 分配递增的 z-index
   *
   * @param nodeId 节点 ID
   * @returns 分配的 z-index 值
   */
  const allocate = (nodeId: string): number => {
    counter += 1;
    allocatedZIndexes.value.set(nodeId, counter);

    // 如果 Map 太大，清理最旧的节点（保留最近 N 个）
    if (allocatedZIndexes.value.size > maxNodes) {
      let minZIndex = Infinity;
      let minNodeId: string | null = null;
      for (const [id, zIndex] of allocatedZIndexes.value.entries()) {
        if (zIndex < minZIndex) {
          minZIndex = zIndex;
          minNodeId = id;
        }
      }
      if (minNodeId) {
        allocatedZIndexes.value.delete(minNodeId);
      }
    }

    triggerRef(allocatedZIndexes);
    return counter;
  };

  /**
   * 移除节点的 z-index
   *
   * @param nodeId 节点 ID
   */
  const remove = (nodeId: string): void => {
    if (allocatedZIndexes.value.delete(nodeId)) {
      triggerRef(allocatedZIndexes);
    }
  };

  /** 清除所有分配的 z-index */
  const clear = (): void => {
    if (allocatedZIndexes.value.size > 0) {
      allocatedZIndexes.value.clear();
      triggerRef(allocatedZIndexes);
    }
  };

  return {
    allocatedZIndexes,
    allocate,
    remove,
    clear
  };
}
