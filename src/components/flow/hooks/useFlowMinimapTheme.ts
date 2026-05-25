/** 小地图主题：跟随应用 Naive UI / themeStore，与 Markdown 组件策略一致 */

import { computed } from 'vue';
import type { CSSProperties } from 'vue';
import { storeToRefs } from 'pinia';
import { useThemeVars } from 'naive-ui';
import { useThemeStore } from '@/store/modules/theme';
import type { MinimapTheme } from '../minimap/types';
import { DEFAULT_MINIMAP_THEME } from '../minimap/types';

/** 视口框半透明填充（勿用 primaryColorSuppl，会挡住节点） */
export function viewportFillFromPrimary(primaryColor: string, alphaPercent = 14): string {
  return `color-mix(in srgb, ${primaryColor} ${alphaPercent}%, transparent)`;
}

export interface UseFlowMinimapThemeOptions {
  /** 是否跟随全局主题（默认 true） */
  syncAppTheme?: boolean;
  overrides?: Partial<MinimapTheme>;
}

export function useFlowMinimapTheme(options: UseFlowMinimapThemeOptions = {}) {
  const { syncAppTheme = true, overrides } = options;
  const themeStore = useThemeStore();
  const { darkMode } = storeToRefs(themeStore);
  const themeVars = useThemeVars();

  const cssVars = computed<CSSProperties>(() => {
    if (!syncAppTheme) {
      return {};
    }
    return {
      '--flow-minimap-surface-bg': themeVars.value.cardColor,
      '--flow-minimap-surface-border': themeVars.value.borderColor,
      '--flow-minimap-node-fill': themeVars.value.primaryColor,
      '--flow-minimap-node-opacity': '0.75',
      '--flow-minimap-viewport-stroke': themeVars.value.primaryColor,
      '--flow-minimap-viewport-fill': viewportFillFromPrimary(themeVars.value.primaryColor)
    };
  });

  const resolvedTheme = computed<MinimapTheme>(() => {
    if (!syncAppTheme) {
      return { ...DEFAULT_MINIMAP_THEME, ...overrides };
    }
    const primary = themeVars.value.primaryColor;
    return {
      surfaceBackground: themeVars.value.cardColor,
      surfaceBorder: themeVars.value.borderColor,
      nodeFill: primary,
      nodeOpacity: 0.75,
      viewportStroke: primary,
      viewportFill: viewportFillFromPrimary(primary),
      ...overrides
    };
  });

  const themeClass = computed(() =>
    darkMode.value ? 'flow-minimap--dark' : 'flow-minimap--light'
  );

  return {
    darkMode,
    cssVars,
    resolvedTheme,
    themeClass
  };
}
