import type { FlowI18nMessages } from './types';

/** English (US) */
export const flowEnUS: FlowI18nMessages = {
  canvas: {
    ariaLabel: 'Flow diagram canvas'
  },
  toolbar: {
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    layoutLock: 'Lock layout',
    layoutUnlock: 'Unlock layout',
    layoutLockTitle: 'Lock node layout; only pan and zoom the canvas',
    layoutUnlockTitle: 'Unlock node layout; nodes can be dragged',
    fitView: 'Fit view',
    resetView: 'Reset view'
  },
  emptyState: {
    title: 'Canvas is empty',
    description: 'Add nodes to start building your flow'
  },
  node: {
    ariaLabel: 'Node {label}'
  },
  handle: {
    source: 'Output port {id}',
    target: 'Input port {id}'
  }
};
