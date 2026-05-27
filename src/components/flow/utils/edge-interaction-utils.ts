/**
 * 连接线交互工具（选中 / 删除 / 键盘守卫）
 *
 * 集中判断逻辑，供事件层、快捷键与渲染层复用，避免散落硬编码。
 */

import type { FlowConfig } from '../types/flow-config';
import type { FlowEdge } from '../types/flow-edge';
import type { FlowNode } from '../types/flow-node';
import { DEFAULT_EDGE_CONFIG, DEFAULT_INTERACTION_CONFIG } from '../config/default-config';

/** 是否正在输入，不应触发画布快捷键 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }

  if (target.isContentEditable) {
    return true;
  }

  return Boolean(target.closest('[contenteditable="true"]'));
}

/** 是否应由 Flow 画布处理键盘事件（需先点击画布获得焦点） */
export function shouldHandleFlowKeyboardEvent(
  event: KeyboardEvent,
  canvasEl: HTMLElement | null
): boolean {
  if (!canvasEl) {
    return false;
  }

  if (isEditableTarget(event.target)) {
    return false;
  }

  const active = document.activeElement;
  if (active && isEditableTarget(active)) {
    return false;
  }

  return active === canvasEl || Boolean(active && canvasEl.contains(active));
}

/** 连接线是否允许选中 */
export function isEdgeSelectable(edge: FlowEdge, config?: Readonly<FlowConfig>): boolean {
  if (edge.selectable === false) {
    return false;
  }

  const globalSelectable =
    config?.interaction?.edgesSelectable ?? DEFAULT_INTERACTION_CONFIG.edgesSelectable;
  return globalSelectable !== false;
}

/** 连接线是否允许删除 */
export function isEdgeDeletable(edge: FlowEdge, config?: Readonly<FlowConfig>): boolean {
  if (edge.deletable === false) {
    return false;
  }

  const edgeDefaultDeletable = config?.edges?.deletable ?? DEFAULT_EDGE_CONFIG.deletable;
  if (edgeDefaultDeletable === false) {
    return false;
  }

  const globalDeletable =
    config?.interaction?.edgesDeletable ?? DEFAULT_INTERACTION_CONFIG.edgesDeletable;
  return globalDeletable !== false;
}

/** 节点是否允许删除 */
export function isNodeDeletable(node: FlowNode, config?: Readonly<FlowConfig>): boolean {
  if (node.deletable === false) {
    return false;
  }

  return config?.nodes?.deletable !== false;
}

/** 连接线点击热区宽度（屏幕像素） */
export function getEdgeClickAreaWidth(config?: Readonly<FlowConfig>): number {
  return config?.edges?.clickAreaWidth ?? DEFAULT_EDGE_CONFIG.clickAreaWidth ?? 24;
}

/** 删除按钮尺寸（屏幕像素） */
export function getEdgeDeleteButtonSize(config?: Readonly<FlowConfig>): number {
  return config?.edges?.deleteButtonSize ?? DEFAULT_EDGE_CONFIG.deleteButtonSize ?? 20;
}

/** 选中连接线时是否显示删除按钮 */
export function shouldShowEdgeDeleteButton(edge: FlowEdge, config?: Readonly<FlowConfig>): boolean {
  if (!isEdgeDeletable(edge, config)) {
    return false;
  }

  const showButton =
    config?.edges?.showDeleteButtonOnSelect ?? DEFAULT_EDGE_CONFIG.showDeleteButtonOnSelect;
  return showButton !== false;
}

/** 过滤可删除的选中项 */
export function filterDeletableSelection<T extends FlowEdge | FlowNode>(
  items: T[],
  config: Readonly<FlowConfig> | undefined,
  predicate: (item: T, config?: Readonly<FlowConfig>) => boolean
): T[] {
  return items.filter(item => predicate(item, config));
}
