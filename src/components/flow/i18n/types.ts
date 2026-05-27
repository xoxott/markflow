/** Flow 内置 i18n 类型 */

import type { FlowLocale } from '../types/flow-config';

export type { FlowLocale };

/** 文案结构（toolbar / emptyState / a11y 等） */
export interface FlowI18nMessages {
  canvas: {
    ariaLabel: string;
  };
  toolbar: {
    zoomOut: string;
    zoomIn: string;
    layoutLock: string;
    layoutUnlock: string;
    layoutLockTitle: string;
    layoutUnlockTitle: string;
    fitView: string;
    resetView: string;
  };
  emptyState: {
    title: string;
    description: string;
  };
  node: {
    /** 占位符 {label} */
    ariaLabel: string;
  };
  handle: {
    /** 占位符 {id}，无 id 时可省略 */
    source: string;
    target: string;
  };
}
