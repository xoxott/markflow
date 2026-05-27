/**
 * Flow 主题注入：让 flow 子树和宿主应用解耦
 *
 * - 宿主应用通过 `provide(flowDarkModeKey, ref)` 把自己的 darkMode 注入进来
 * - 没注入时，flow 组件回退到操作系统偏好（`usePreferredColorScheme`）
 * - 关键点：flow 组件**不再**直接 import `@/store/modules/theme`，
 *   因此可以被任何项目独立挂载、测试
 */

import { type InjectionKey, type Ref, computed, inject } from 'vue';
import { usePreferredColorScheme } from '@vueuse/core';

export const flowDarkModeKey: InjectionKey<Ref<boolean>> = Symbol('flowDarkMode');

/** 解析当前 darkMode：优先用注入值，否则按操作系统主题 */
export function useFlowDarkMode(override?: Ref<boolean>): Ref<boolean> {
  if (override) {
    return override;
  }
  const injected = inject(flowDarkModeKey, null);
  if (injected) {
    return injected;
  }
  const osTheme = usePreferredColorScheme();
  return computed(() => osTheme.value === 'dark');
}
