/**
 * 画布布局锁定：锁定后仅可平移/缩放视口，不可拖拽节点或改连线
 */

import { ref } from 'vue';
import type { PartialFlowConfig } from '../types';

export function useLayoutLock(updateConfig: (partialConfig: PartialFlowConfig) => void) {
  const layoutLocked = ref(false);

  const applyLayoutLock = (locked: boolean) => {
    updateConfig({
      nodes: {
        draggable: !locked,
        connectable: !locked,
        deletable: !locked
      },
      edges: {
        deletable: !locked
      }
    });
  };

  const setLayoutLocked = (locked: boolean) => {
    layoutLocked.value = locked;
    applyLayoutLock(locked);
  };

  const toggleLayoutLock = () => {
    setLayoutLocked(!layoutLocked.value);
  };

  return {
    layoutLocked,
    setLayoutLocked,
    toggleLayoutLock
  };
}
