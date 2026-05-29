import { $t } from '@/locales';
import {
  ACTION_COLUMN_BUTTON_WIDTH,
  ACTION_COLUMN_KEY,
  ACTION_COLUMN_MORE_WIDTH,
  ACTION_COLUMN_WIDTH_MENU
} from '../actions/constants';
import type { ActionRendererConfig, TableColumnConfig } from '../types';

function resolveActionColumnWidth(config: ActionRendererConfig): number {
  if (config.mode === 'menu') {
    return ACTION_COLUMN_WIDTH_MENU;
  }

  const maxShow = config.maxShow ?? 2;
  const visibleCount = Math.min(config.buttons.length, maxShow);
  const hasOverflow = config.buttons.length > maxShow;

  return visibleCount * ACTION_COLUMN_BUTTON_WIDTH + (hasOverflow ? ACTION_COLUMN_MORE_WIDTH : 0);
}

/** 生成标准行操作列：统一 key、fixed、render 预设与列宽。 */
export function createActionColumn<T = any>(
  config: ActionRendererConfig,
  options?: { title?: string; width?: number; key?: string }
): TableColumnConfig<T> {
  return {
    title: options?.title ?? $t('common.operate'),
    key: options?.key ?? ACTION_COLUMN_KEY,
    width: options?.width ?? resolveActionColumnWidth(config),
    fixed: 'right',
    render: 'action',
    renderConfig: config
  };
}

export { resolveActionColumnWidth };
