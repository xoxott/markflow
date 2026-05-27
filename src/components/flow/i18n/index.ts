import type { FlowI18nMessages, FlowLocale } from './types';
import { flowZhCN } from './zh-CN';
import { flowEnUS } from './en-US';

export type { FlowLocale, FlowI18nMessages } from './types';
export { flowZhCN } from './zh-CN';
export { flowEnUS } from './en-US';

const MESSAGES: Record<FlowLocale, FlowI18nMessages> = {
  'zh-CN': flowZhCN,
  'en-US': flowEnUS
};

export function getFlowMessages(locale: FlowLocale): FlowI18nMessages {
  return MESSAGES[locale] ?? flowZhCN;
}

/** 点路径键，如 `toolbar.zoomIn` */
export type FlowI18nKey =
  | `canvas.${keyof FlowI18nMessages['canvas']}`
  | `toolbar.${keyof FlowI18nMessages['toolbar']}`
  | `emptyState.${keyof FlowI18nMessages['emptyState']}`
  | `node.${keyof FlowI18nMessages['node']}`
  | `handle.${keyof FlowI18nMessages['handle']}`;

export function resolveFlowMessage(
  messages: FlowI18nMessages,
  key: FlowI18nKey,
  params?: Record<string, string | number>
): string {
  const [section, field] = key.split('.') as [keyof FlowI18nMessages, string];
  const template = (messages[section] as Record<string, string>)[field] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? ''));
}
