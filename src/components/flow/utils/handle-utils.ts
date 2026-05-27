/** 端口（Handle）工具函数 */

import type { CSSProperties } from 'vue';
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
  customStyle?: CSSProperties
): CSSProperties {
  return {
    position: 'absolute',
    width: `calc(${HANDLE_SIZES.WIDTH}px * var(--flow-zoom, 1))`,
    height: `calc(${HANDLE_SIZES.HEIGHT}px * var(--flow-zoom, 1))`,
    borderRadius: '50%',
    backgroundColor: 'var(--flow-handle-bg)',
    border: `calc(${HANDLE_SIZES.BORDER_WIDTH}px * var(--flow-zoom, 1)) solid ${handleBorderVar(handle.type)}`,
    cursor: 'crosshair',
    zIndex: 10,
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    ...((handle.style as CSSProperties | undefined) ?? {}),
    ...customStyle
  };
}

export function calculateHandlePositionStyle(handle: FlowHandle): CSSProperties {
  const positionStyle: CSSProperties = {};

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
