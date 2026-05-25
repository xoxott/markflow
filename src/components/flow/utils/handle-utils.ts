/** 端口（Handle）工具函数 */

import type { FlowHandle } from '../types/flow-node';

export const HANDLE_SIZES = {
  WIDTH: 12,
  HEIGHT: 12,
  BORDER_WIDTH: 2
} as const;

/** 端口边框色 CSS 变量 */
export function handleBorderVar(type: FlowHandle['type']): string {
  switch (type) {
    case 'source':
      return 'var(--flow-handle-border-source)';
    case 'target':
      return 'var(--flow-handle-border-target)';
    default:
      return 'var(--flow-handle-border-default)';
  }
}

export function calculateHandleStyle(
  handle: FlowHandle,
  customStyle?: Record<string, unknown>
): Record<string, unknown> {
  return {
    position: 'absolute',
    width: `${HANDLE_SIZES.WIDTH}px`,
    height: `${HANDLE_SIZES.HEIGHT}px`,
    borderRadius: '50%',
    backgroundColor: 'var(--flow-handle-bg)',
    border: `${HANDLE_SIZES.BORDER_WIDTH}px solid ${handleBorderVar(handle.type)}`,
    cursor: 'crosshair',
    zIndex: 10,
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    ...handle.style,
    ...customStyle
  };
}

export function calculateHandlePositionStyle(handle: FlowHandle): Record<string, string> {
  const positionStyle: Record<string, string> = {};

  switch (handle.position) {
    case 'top':
      positionStyle.left = '50%';
      positionStyle.top = '0';
      positionStyle.transform = 'translate(-50%, -50%)';
      break;
    case 'bottom':
      positionStyle.left = '50%';
      positionStyle.bottom = '0';
      positionStyle.transform = 'translate(-50%, 50%)';
      break;
    case 'left':
      positionStyle.left = '0';
      positionStyle.top = '50%';
      positionStyle.transform = 'translate(-50%, -50%)';
      break;
    case 'right':
      positionStyle.right = '0';
      positionStyle.top = '50%';
      positionStyle.transform = 'translate(50%, -50%)';
      break;
    default:
      break;
  }

  return positionStyle;
}

export function getHandleClass(handle: FlowHandle): string {
  return `flow-handle flow-handle-${handle.type} flow-handle-${handle.position}`;
}
