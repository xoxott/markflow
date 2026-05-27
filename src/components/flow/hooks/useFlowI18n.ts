/**
 * Flow 内置 i18n Hook
 *
 * 从 FlowConfig.locale（或 theme.locale）读取语言，返回 t() 翻译函数
 */

import { type Ref, computed } from 'vue';
import type { FlowConfig } from '../types/flow-config';
import { type FlowI18nKey, type FlowLocale, getFlowMessages, resolveFlowMessage } from '../i18n';
import { useFlowCanvasContextOptional } from './useFlowCanvasContext';

export interface UseFlowI18nOptions {
  /** 显式指定 config（未 inject 画布上下文时使用） */
  config?: Ref<Readonly<FlowConfig>>;
  /** 显式覆盖 locale（优先级最高） */
  locale?: FlowLocale;
}

function resolveLocale(
  config: Readonly<FlowConfig> | undefined,
  override?: FlowLocale
): FlowLocale {
  if (override) return override;
  const fromTop = config?.locale;
  if (fromTop === 'zh-CN' || fromTop === 'en-US') return fromTop;
  const fromTheme = config?.theme?.locale;
  if (fromTheme === 'zh-CN' || fromTheme === 'en-US') return fromTheme;
  return 'zh-CN';
}

/**
 * 获取 Flow 文案翻译函数
 *
 * @example
 *   ```ts
 *   const { t, locale } = useFlowI18n();
 *   t('toolbar.zoomIn');
 *   t('node.ariaLabel', { label: 'Start' });
 *   ```;
 */
export function useFlowI18n(options: UseFlowI18nOptions = {}) {
  const canvasCtx = useFlowCanvasContextOptional();
  const configRef = computed(() => options.config?.value ?? canvasCtx?.config.value);

  const locale = computed(() => resolveLocale(configRef.value, options.locale));

  const messages = computed(() => getFlowMessages(locale.value));

  const t = (key: FlowI18nKey, params?: Record<string, string | number>) =>
    resolveFlowMessage(messages.value, key, params);

  return {
    locale,
    messages,
    t
  };
}
