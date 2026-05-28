/** FlowCanvas 快捷键层：键盘监听、剪贴板、序列化 */

import type { Ref } from 'vue';
import type { FlowConfig, FlowEdge, FlowNode } from '../../types';
import { shouldHandleFlowKeyboardEvent } from '../../utils/edge-interaction-utils';
import { logger } from '../../utils/logger';
import {
  applyClipboardPayload,
  buildClipboardPayload,
  readClipboard,
  writeClipboard
} from '../../utils/clipboard-utils';
import { fromJSON, toJSON } from '../../utils/serialization-utils';
import type { FlowSnapshot } from '../../utils/serialization-utils';
import { registerFlowCanvasShortcuts } from '../useFlowCanvasKeyboard';
import { useKeyboard } from '../useKeyboard';
import type { UseFlowCanvasStateReturn } from './useFlowCanvasState';

export interface UseFlowCanvasShortcutsOptions {
  canvasRef: Ref<HTMLElement | null>;
  config: Ref<Readonly<FlowConfig>>;
  flowState: UseFlowCanvasStateReturn['flowState'];
  guidesManager: UseFlowCanvasStateReturn['guidesManager'];
  addNode: UseFlowCanvasStateReturn['addNode'];
  addEdge: UseFlowCanvasStateReturn['addEdge'];
  /** 是否注册剪贴板快捷键（默认 true） */
  clipboardShortcuts?: boolean;
}

export function useFlowCanvasShortcuts(options: UseFlowCanvasShortcutsOptions) {
  const {
    canvasRef,
    config,
    flowState,
    guidesManager,
    addNode,
    addEdge,
    clipboardShortcuts = true
  } = options;

  const {
    nodes,
    edges,
    viewport,
    selectedNodeIds,
    selectedEdgeIds,
    removeNode,
    removeEdge,
    selectNodes,
    selectEdge,
    deselectAll,
    isEdgeSelected,
    setViewport,
    stateStore,
    historyManager
  } = flowState;

  const keyboard = useKeyboard({
    enabled: true,
    target: canvasRef,
    guard: event => shouldHandleFlowKeyboardEvent(event, canvasRef.value)
  });

  const exportJSON = (opts?: {
    includeViewport?: boolean;
    includeGuides?: boolean;
  }): FlowSnapshot =>
    toJSON(
      {
        nodes: nodes.value,
        edges: edges.value,
        viewport: viewport.value,
        guides: guidesManager.guides.value
      },
      opts
    );

  const importJSON = (
    input: unknown,
    opts?: { replace?: boolean; includeViewport?: boolean }
  ): boolean => {
    try {
      const snapshot = fromJSON(input);
      if (opts?.replace === false) {
        snapshot.nodes.forEach(n => addNode(n));
        snapshot.edges.forEach(e => addEdge(e));
      } else {
        stateStore.setNodes(snapshot.nodes);
        stateStore.setEdges(snapshot.edges);
        deselectAll();
      }
      if (opts?.includeViewport !== false && snapshot.viewport) {
        setViewport(snapshot.viewport);
      }
      if (snapshot.guides) {
        guidesManager.setGuides(snapshot.guides);
      }
      return true;
    } catch (err) {
      logger.warn('[useFlowCanvasShortcuts] importJSON failed', err);
      return false;
    }
  };

  const copySelection = async (): Promise<boolean> => {
    const payload = buildClipboardPayload({
      nodes: nodes.value,
      edges: edges.value,
      selectedNodeIds: selectedNodeIds.value,
      selectedEdgeIds: selectedEdgeIds.value
    });
    return writeClipboard(payload);
  };

  const cutSelection = async (): Promise<boolean> => {
    const copied = await copySelection();
    if (!copied) {
      return false;
    }
    const nodeIds = [...selectedNodeIds.value];
    const edgeIds = [...selectedEdgeIds.value];
    nodeIds.forEach(id => removeNode(id));
    edgeIds.forEach(id => removeEdge(id));
    deselectAll();
    return true;
  };

  const pasteClipboard = async (): Promise<{ nodeIds: string[]; edgeIds: string[] } | null> => {
    const payload = await readClipboard();
    if (!payload) {
      return null;
    }
    const applied = applyClipboardPayload(payload);
    applied.nodes.forEach(n => addNode(n));
    applied.edges.forEach(e => addEdge(e));
    selectNodes(applied.nodes.map(n => n.id));
    return {
      nodeIds: applied.nodes.map(n => n.id),
      edgeIds: applied.edges.map(e => e.id)
    };
  };

  const unregisterShortcuts = registerFlowCanvasShortcuts(keyboard, {
    config,
    selection: {
      getSelectedNodes: (nodeList: FlowNode[]) =>
        nodeList.filter(n => selectedNodeIds.value.includes(n.id)),
      getSelectedEdges: (edgeList: FlowEdge[]) =>
        edgeList.filter(e => selectedEdgeIds.value.includes(e.id)),
      selectNodes,
      selectEdge,
      deselectAll,
      isEdgeSelected,
      setSelection: (nodeIds: string[], edgeIds: string[]) => {
        flowState.selectionHandler.setSelection(nodeIds, edgeIds);
        flowState.stateStore.setSelectedNodeIds(nodeIds);
        flowState.stateStore.setSelectedEdgeIds(edgeIds);
      }
    },
    historyOperations: {
      undo: () => historyManager.undo(),
      redo: () => historyManager.redo(),
      canUndo: () => historyManager.canUndo(),
      canRedo: () => historyManager.canRedo()
    },
    selectedNodeIds,
    selectedEdgeIds,
    nodes,
    edges,
    removeNode,
    removeEdge,
    ...(clipboardShortcuts
      ? {
          clipboard: {
            copy: () => {
              copySelection().catch(err =>
                logger.warn('[useFlowCanvasShortcuts] copy failed', err)
              );
            },
            cut: () => {
              cutSelection().catch(err => logger.warn('[useFlowCanvasShortcuts] cut failed', err));
            },
            paste: async () => {
              await pasteClipboard();
            }
          }
        }
      : {}),
    canvasRef
  });

  return {
    keyboard,
    unregisterShortcuts,
    exportJSON,
    importJSON,
    copySelection,
    cutSelection,
    pasteClipboard
  };
}
