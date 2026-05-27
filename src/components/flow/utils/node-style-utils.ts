/**
 * 节点样式工具函数
 *
 * 布局用内联样式，颜色由 .flow-node + --flow-* CSS 变量（在 FlowCanvas 上注入）承担
 */

import type { CSSProperties } from 'vue';
import type { FlowNode } from '../types';

/** 节点容器样式选项 */
export interface NodeContainerStyleOptions {
  node: FlowNode;
  selected?: boolean;
  locked?: boolean;
  dragging?: boolean;
  customStyle?: CSSProperties;
}

/** 计算节点容器样式（仅布局与交互，不内联主题色） */
export function calculateNodeContainerStyle(options: NodeContainerStyleOptions): CSSProperties {
  const { node, customStyle } = options;

  return {
    position: 'relative',
    width: '100%',
    height: '100%',
    userSelect: 'none',
    pointerEvents: 'auto',
    boxSizing: 'border-box',
    ...((node.style as CSSProperties | undefined) ?? {}),
    ...customStyle
  };
}

export function calculateNodeClass(options: {
  nodeClass?: string;
  customClass?: string;
  selected?: boolean;
  locked?: boolean;
  dragging?: boolean;
}): string {
  const { nodeClass, customClass, selected, locked, dragging } = options;
  const classes = ['flow-node', nodeClass, customClass];

  if (selected) classes.push('flow-node-selected');
  if (locked) classes.push('flow-node-locked');
  if (dragging) classes.push('flow-node-dragging');

  return classes.filter(Boolean).join(' ');
}
