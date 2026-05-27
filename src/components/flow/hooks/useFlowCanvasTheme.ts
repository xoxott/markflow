/** Flow 画布主题：跟随应用 Naive UI / themeStore，注入 --flow-* CSS 变量 */

import { computed, watchEffect } from 'vue';
import type { CSSProperties, Ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useThemeVars } from 'naive-ui';
import { useThemeStore } from '@/store/modules/theme';
import { viewportFillFromPrimary } from './useFlowMinimapTheme';

export interface UseFlowCanvasThemeOptions {
  /** 是否跟随全局主题（默认 true） */
  syncAppTheme?: boolean;
  /** 画布根元素，用于 data-flow-theme */
  canvasRef?: Ref<HTMLElement | null>;
}

export interface FlowCanvasResolvedColors {
  backgroundColor?: string;
  gridColor?: string;
  gridOpacity?: number;
}

export function useFlowCanvasTheme(options: UseFlowCanvasThemeOptions = {}) {
  const { syncAppTheme = true, canvasRef } = options;
  const themeStore = useThemeStore();
  const { darkMode } = storeToRefs(themeStore);
  const themeVars = useThemeVars();

  /** 与 Markdown 容器一致：浅色 baseColor，暗色 cardColor */
  const canvasBackground = computed(() =>
    darkMode.value ? themeVars.value.cardColor : themeVars.value.baseColor
  );

  const cssVars = computed<CSSProperties>(() => {
    if (!syncAppTheme) {
      return {};
    }

    const primary = themeVars.value.primaryColor;
    const divider = themeVars.value.dividerColor;
    const bg = canvasBackground.value;

    return {
      '--flow-background-color': bg,
      'backgroundColor': bg,
      '--flow-grid-color': divider,
      '--flow-grid-opacity': darkMode.value ? '0.55' : '0.75',
      '--flow-node-bg': themeVars.value.cardColor,
      '--flow-node-border': themeVars.value.borderColor,
      '--flow-node-border-selected': primary,
      '--flow-node-border-hover': primary,
      '--flow-node-shadow-selected': `color-mix(in srgb, ${primary} 22%, transparent)`,
      '--flow-node-shadow-hover': darkMode.value
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(0, 0, 0, 0.08)',
      '--flow-node-text': themeVars.value.textColor1,
      '--flow-node-text-secondary': themeVars.value.textColor2,
      '--flow-handle-bg': themeVars.value.cardColor,
      '--flow-handle-border-source': themeVars.value.successColor,
      '--flow-handle-border-target': primary,
      '--flow-handle-border-default': primary,
      '--flow-edge-default': divider,
      '--flow-edge-selected': primary,
      '--flow-edge-hovered': primary,
      '--flow-edge-label': themeVars.value.textColor3,
      '--flow-preview-color': primary,
      '--flow-minimap-surface-bg': themeVars.value.cardColor,
      '--flow-minimap-surface-border': themeVars.value.borderColor,
      '--flow-minimap-node-fill': primary,
      '--flow-minimap-node-opacity': '0.75',
      '--flow-minimap-viewport-stroke': primary,
      '--flow-minimap-viewport-fill': viewportFillFromPrimary(primary),
      '--flow-toolbar-bg': `color-mix(in srgb, ${themeVars.value.cardColor} 92%, transparent)`,
      '--flow-toolbar-border': themeVars.value.borderColor,
      '--flow-toolbar-text': themeVars.value.textColor2,
      '--flow-toolbar-button-bg': themeVars.value.cardColor,
      '--flow-toolbar-button-border': themeVars.value.borderColor,
      '--flow-toolbar-shadow': darkMode.value
        ? '0 2px 8px rgba(0, 0, 0, 0.35)'
        : '0 2px 8px rgba(0, 0, 0, 0.1)'
    };
  });

  const resolvedColors = computed<FlowCanvasResolvedColors>(() => {
    if (!syncAppTheme) {
      return {};
    }
    return {
      backgroundColor: canvasBackground.value,
      gridColor: themeVars.value.dividerColor,
      gridOpacity: darkMode.value ? 0.55 : 0.75
    };
  });

  const themeClass = computed(() => (darkMode.value ? 'flow-canvas--dark' : 'flow-canvas--light'));

  watchEffect(() => {
    if (!canvasRef?.value) {
      return;
    }
    canvasRef.value.setAttribute('data-flow-theme', darkMode.value ? 'dark' : 'light');
  });

  return {
    darkMode,
    canvasBackground,
    cssVars,
    resolvedColors,
    themeClass
  };
}
