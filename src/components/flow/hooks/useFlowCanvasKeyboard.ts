/**
 * FlowCanvas 键盘快捷键配置
 *
 * 集中管理 FlowCanvas 的键盘快捷键注册
 */

import type { Ref } from 'vue';
import type { FlowEdge, FlowNode } from '../types';
import type { KeyHandler } from '../core/interaction/FlowKeyboardHandler';
import type { UseKeyboardReturn } from './useKeyboard';

export interface FlowCanvasKeyboardDeps {
  selection: {
    getSelectedNodes: (nodes: FlowNode[]) => FlowNode[];
    getSelectedEdges: (edges: FlowEdge[]) => FlowEdge[];
    selectNodes: (nodeIds: string[]) => void;
    selectEdge: (edgeId: string, addToSelection?: boolean) => void;
    deselectAll: () => void;
    isEdgeSelected: (edgeId: string) => boolean;
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
}

export function registerFlowCanvasShortcuts(
  keyboard: Pick<UseKeyboardReturn, 'register'>,
  deps: FlowCanvasKeyboardDeps
): () => void {
  const {
    selection,
    historyOperations,
    selectedNodeIds,
    selectedEdgeIds,
    nodes,
    edges,
    removeNode,
    removeEdge
  } = deps;

  const unregisters: (() => void)[] = [];

  const handleDelete: KeyHandler = () => {
    const selectedNodes = selection.getSelectedNodes(nodes.value);
    const selectedEdges = selection.getSelectedEdges(edges.value);

    selectedNodes.forEach(node => removeNode(node.id));
    selectedEdges.forEach(edge => removeEdge(edge.id));

    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      selection.deselectAll();
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
    selection.selectNodes(nodes.value.map(node => node.id));
    return undefined;
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

  return () => {
    unregisters.forEach(unregister => unregister());
  };
}
