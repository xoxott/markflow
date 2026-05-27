/**
 * 节点样式工具函数
 *
 * 布局用内联样式，颜色由 .flow-node + --flow-* CSS 变量（在 FlowCanvas 上注入）承担
 */

import type { FlowNode } from '../types';

/** 节点容器样式选项 */
export interface NodeContainerStyleOptions {
  node: FlowNode;
  selected?: boolean;
  locked?: boolean;
  hovered?: boolean;
  dragging?: boolean;
  customStyle?: Record<string, unknown>;
}

/** 计算节点容器样式（仅布局与交互，不内联主题色） */
export function calculateNodeContainerStyle(
  options: NodeContainerStyleOptions
): Record<string, unknown> {
  const { node, customStyle } = options;

  return {
    position: 'relative',
    width: '100%',
    height: '100%',
    userSelect: 'none',
    pointerEvents: 'auto',
    boxSizing: 'border-box',
    ...node.style,
    ...customStyle
  };
}

export function calculateNodeClass(options: {
  nodeClass?: string;
  customClass?: string;
  selected?: boolean;
  locked?: boolean;
  hovered?: boolean;
  dragging?: boolean;
}): string {
  const { nodeClass, customClass, selected, locked, hovered, dragging } = options;
  const classes = ['flow-node', nodeClass, customClass];

  if (selected) classes.push('flow-node-selected');
  if (locked) classes.push('flow-node-locked');
  if (hovered) classes.push('flow-node-hovered');
  if (dragging) classes.push('flow-node-dragging');

  return classes.filter(Boolean).join(' ');
}
