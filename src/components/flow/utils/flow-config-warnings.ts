/** Flow 配置运行时警告（开发环境） */

import type { FlowConfig } from '../types';

export function warnUnusedPerformanceFlags(config: Readonly<FlowConfig>): void {
  if (!import.meta.env.DEV) return;

  if (config.performance?.enableVirtualScroll) {
    console.warn(
      '[Flow] enableVirtualScroll 已弃用：请使用 enableViewportCulling（视口裁剪）替代 VirtualScroller。'
    );
  }
}
