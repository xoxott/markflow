import type { FlowI18nMessages } from './types';

/** 简体中文 */
export const flowZhCN: FlowI18nMessages = {
  canvas: {
    ariaLabel: '流程图画布'
  },
  toolbar: {
    zoomOut: '缩小',
    zoomIn: '放大',
    layoutLock: '锁定',
    layoutUnlock: '解锁',
    layoutLockTitle: '锁定节点布局，仅可拖动画布',
    layoutUnlockTitle: '解锁节点布局，可拖拽节点',
    ruler: '刻度尺',
    rulerShowTitle: '显示顶部与左侧刻度尺',
    rulerHideTitle: '隐藏刻度尺',
    dragSnapGuides: '对齐线',
    dragSnapGuidesEnableTitle: '拖节点时显示对齐参考线并吸附',
    dragSnapGuidesDisableTitle: '关闭拖拽对齐参考线',
    fitView: '适应',
    resetView: '重置'
  },
  emptyState: {
    title: '画布为空',
    description: '开始添加节点来构建您的流程图'
  },
  node: {
    ariaLabel: '节点 {label}'
  },
  handle: {
    source: '输出端口 {id}',
    target: '输入端口 {id}'
  }
};
