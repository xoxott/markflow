/** 选择逻辑桥接：FlowSelectionHandler ↔ DefaultStateStore */

import { markRaw } from 'vue';
import type { DefaultStateStore } from '../stores/DefaultStateStore';
import {
  FlowSelectionHandler,
  type SelectionOptions
} from '../../interaction/FlowSelectionHandler';

export interface SelectionBridge {
  handler: FlowSelectionHandler;
}

/** 创建选择处理器并同步选中 ID 到 store */
export function createSelectionBridge(
  store: DefaultStateStore,
  selectionOptions?: Partial<SelectionOptions>
): SelectionBridge {
  const handler = markRaw(
    new FlowSelectionHandler({
      options: selectionOptions,
      onSelectionChange: (nodeIds, edgeIds) => {
        store.setSelectedNodeIds(nodeIds);
        store.setSelectedEdgeIds(edgeIds);
      }
    })
  );

  return { handler };
}

/** 从初始节点恢复选中状态 */
export function initSelectionFromNodes(
  handler: FlowSelectionHandler,
  initialSelectedNodeIds: string[]
): void {
  if (initialSelectedNodeIds.length > 0) {
    handler.selectNodes(initialSelectedNodeIds);
  }
}
