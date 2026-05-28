import { h, render } from 'vue';
import { WORKFLOW_NODE_SIZE } from '../constants/workflow-layout';
import type { WorkflowNodeTypeConfig } from '../registry/node-registry';
import WorkflowNodeCard from './WorkflowNodeCard';
import '../styles/workflow-flow-nodes.scss';

/** 创建与画布节点同尺寸的拖拽预览（避免 cloneNode 带入节点库面板的多余宽度） */
export function createWorkflowDragImage(config: WorkflowNodeTypeConfig): HTMLElement {
  const host = document.createElement('div');
  Object.assign(host.style, {
    position: 'absolute',
    top: '-9999px',
    left: '-9999px',
    width: `${WORKFLOW_NODE_SIZE.width}px`,
    height: `${WORKFLOW_NODE_SIZE.height}px`,
    pointerEvents: 'none',
    borderRadius: '8px'
  });
  document.body.appendChild(host);

  render(
    h(WorkflowNodeCard, {
      variant: 'ghost',
      label: config.label,
      description: config.description,
      icon: config.icon,
      color: config.color
    }),
    host
  );

  const ghost = host.firstElementChild as HTMLElement | null;
  if (ghost) {
    Object.assign(ghost.style, {
      width: `${WORKFLOW_NODE_SIZE.width}px`,
      height: `${WORKFLOW_NODE_SIZE.height}px`,
      opacity: '1'
    });
  }

  Object.assign(host.style, {
    filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.16))'
  });

  return host;
}

export function setWorkflowDragImage(event: DragEvent, config: WorkflowNodeTypeConfig) {
  if (!event.dataTransfer) return;

  const host = createWorkflowDragImage(config);

  event.dataTransfer.setDragImage(
    host,
    WORKFLOW_NODE_SIZE.width / 2,
    WORKFLOW_NODE_SIZE.height / 2
  );

  requestAnimationFrame(() => {
    render(null, host);
    host.remove();
  });
}
