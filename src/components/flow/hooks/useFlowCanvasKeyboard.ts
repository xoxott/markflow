/**
 * FlowCanvas 键盘快捷键配置
 *
 * 集中管理 FlowCanvas 的键盘快捷键注册
 */

import type { Ref } from 'vue';
import type { FlowConfig, FlowEdge, FlowNode } from '../types';
import type { KeyHandler } from '../core/interaction/FlowKeyboardHandler';
import { isEdgeDeletable, isNodeDeletable } from '../utils/edge-interaction-utils';
import {
  type NodeFocusDirection,
  findNextNodeInDirection,
  focusFlowNodeElement
} from '../utils/node-focus-utils';
import type { UseKeyboardReturn } from './useKeyboard';

export interface FlowCanvasKeyboardDeps {
  config: Ref<Readonly<FlowConfig>>;
  selection: {
    getSelectedNodes: (nodes: FlowNode[]) => FlowNode[];
    getSelectedEdges: (edges: FlowEdge[]) => FlowEdge[];
    selectNodes: (nodeIds: string[]) => void;
    selectEdge: (edgeId: string, addToSelection?: boolean) => void;
    deselectAll: () => void;
    isEdgeSelected: (edgeId: string) => boolean;
    /** Phase 5.1：一次性设置节点 + 边选区（用于 Ctrl+A、框选） */
    setSelection?: (nodeIds: string[], edgeIds: string[]) => void;
  };
  historyOperations: {
    undo: () => boolean;
    redo: () => boolean;
    canUndo: () => boolean;
    canRedo: () => boolean;
  };
  selectedNodeIds: Ref<string[]>;
  selectedEdgeIds: Ref<string[]>;
  nodes: Ref<FlowNode[]>;
  edges: Ref<FlowEdge[]>;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  /** Phase 5.3：剪贴板（复制 / 粘贴 / 剪切） */
  clipboard?: {
    copy: () => void;
    cut: () => void;
    paste: () => Promise<void> | void;
  };
  /** Phase 6.1：画布根元素，用于节点焦点移动 */
  canvasRef?: Ref<HTMLElement | null>;
}

function getFocusedNodeId(
  canvasEl: HTMLElement | null | undefined,
  selectedNodeIds: string[]
): string | null {
  const active = document.activeElement;
  if (active && canvasEl?.contains(active)) {
    const wrapper = active.closest('[data-node-id]');
    const id = wrapper?.getAttribute('data-node-id');
    if (id) return id;
  }
  return selectedNodeIds[0] ?? null;
}

const ARROW_DIRECTION: Record<string, NodeFocusDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right'
};

export function registerFlowCanvasShortcuts(
  keyboard: Pick<UseKeyboardReturn, 'register'>,
  deps: FlowCanvasKeyboardDeps
): () => void {
  const {
    config,
    selection,
    historyOperations,
    selectedNodeIds,
    selectedEdgeIds,
    nodes,
    edges,
    removeNode,
    removeEdge,
    clipboard,
    canvasRef
  } = deps;

  const unregisters: (() => void)[] = [];

  const handleDelete: KeyHandler = () => {
    const cfg = config.value;
    const selectedNodes = selection
      .getSelectedNodes(nodes.value)
      .filter(node => isNodeDeletable(node, cfg));
    const selectedEdges = selection
      .getSelectedEdges(edges.value)
      .filter(edge => isEdgeDeletable(edge, cfg));

    selectedNodes.forEach(node => removeNode(node.id));
    selectedEdges.forEach(edge => removeEdge(edge.id));

    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      selection.deselectAll();
      return true;
    }
    return undefined;
  };

  const syncSelectionAfterUndoRedo = () => {
    selection.selectNodes(selectedNodeIds.value);
    selectedEdgeIds.value.forEach((id: string) => {
      if (!selection.isEdgeSelected(id)) {
        selection.selectEdge(id, true);
      }
    });
  };

  const handleUndo: KeyHandler = () => {
    if (historyOperations.undo()) {
      syncSelectionAfterUndoRedo();
    }
    return undefined;
  };

  const handleRedo: KeyHandler = () => {
    if (historyOperations.redo()) {
      syncSelectionAfterUndoRedo();
    }
    return undefined;
  };

  const handleSelectAll: KeyHandler = () => {
    // Phase 5.1：全选 = 节点 + 边
    const allNodeIds = nodes.value.map(node => node.id);
    const allEdgeIds = edges.value.map(edge => edge.id);
    if (selection.setSelection) {
      selection.setSelection(allNodeIds, allEdgeIds);
    } else {
      selection.selectNodes(allNodeIds);
      allEdgeIds.forEach(id => selection.selectEdge(id, true));
    }
    return true;
  };

  unregisters.push(
    keyboard.register({ key: 'Delete' }, handleDelete, {
      description: '删除选中的节点和连接线',
      priority: 10
    })
  );

  unregisters.push(
    keyboard.register({ key: 'Backspace' }, handleDelete, {
      description: '删除选中的节点和连接线',
      priority: 10
    })
  );

  unregisters.push(
    keyboard.register({ key: 'z', ctrl: true }, handleUndo, { description: '撤销', priority: 10 })
  );

  unregisters.push(
    keyboard.register({ key: 'z', meta: true }, handleUndo, { description: '撤销', priority: 10 })
  );

  unregisters.push(
    keyboard.register({ key: 'y', ctrl: true }, handleRedo, { description: '重做', priority: 10 })
  );

  unregisters.push(
    keyboard.register({ key: 'z', meta: true, shift: true }, handleRedo, {
      description: '重做',
      priority: 10
    })
  );

  unregisters.push(
    keyboard.register({ key: 'a', ctrl: true }, handleSelectAll, {
      description: '全选节点',
      priority: 10
    })
  );

  unregisters.push(
    keyboard.register({ key: 'a', meta: true }, handleSelectAll, {
      description: '全选节点',
      priority: 10
    })
  );

  unregisters.push(
    keyboard.register(
      { key: 'Escape' },
      () => {
        selection.deselectAll();
        return undefined;
      },
      {
        description: '取消选择',
        priority: 10
      }
    )
  );

  // Phase 6.1：方向键在节点间移动焦点
  const handleArrowNavigation: KeyHandler = event => {
    const direction = ARROW_DIRECTION[event.key];
    if (!direction || nodes.value.length === 0) return undefined;

    const canvasEl = canvasRef?.value ?? null;
    const currentId = getFocusedNodeId(canvasEl, selectedNodeIds.value);
    const nextId = findNextNodeInDirection(nodes.value, currentId, direction);
    if (!nextId) return undefined;

    selection.selectNodes([nextId]);
    focusFlowNodeElement(canvasEl, nextId);
    return true;
  };

  for (const key of Object.keys(ARROW_DIRECTION)) {
    unregisters.push(
      keyboard.register({ key }, handleArrowNavigation, {
        description: '在节点间移动焦点',
        priority: 8
      })
    );
  }

  // Phase 5.3：剪贴板快捷键（Cmd / Ctrl + C / X / V）
  if (clipboard) {
    const handleCopy: KeyHandler = () => {
      if (selectedNodeIds.value.length === 0) return undefined;
      clipboard.copy();
      return true;
    };
    const handleCut: KeyHandler = () => {
      if (selectedNodeIds.value.length === 0) return undefined;
      clipboard.cut();
      return true;
    };
    const handlePaste: KeyHandler = () => {
      Promise.resolve(clipboard.paste()).catch(() => undefined);
      return true;
    };

    unregisters.push(
      keyboard.register({ key: 'c', ctrl: true }, handleCopy, {
        description: '复制选中节点',
        priority: 10
      })
    );
    unregisters.push(
      keyboard.register({ key: 'c', meta: true }, handleCopy, {
        description: '复制选中节点',
        priority: 10
      })
    );
    unregisters.push(
      keyboard.register({ key: 'x', ctrl: true }, handleCut, {
        description: '剪切选中节点',
        priority: 10
      })
    );
    unregisters.push(
      keyboard.register({ key: 'x', meta: true }, handleCut, {
        description: '剪切选中节点',
        priority: 10
      })
    );
    unregisters.push(
      keyboard.register({ key: 'v', ctrl: true }, handlePaste, {
        description: '粘贴剪贴板',
        priority: 10
      })
    );
    unregisters.push(
      keyboard.register({ key: 'v', meta: true }, handlePaste, {
        description: '粘贴剪贴板',
        priority: 10
      })
    );
  }

  return () => {
    unregisters.forEach(unregister => unregister());
  };
}
