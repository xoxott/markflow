/**
 * 选中边端点拖拽重连
 *
 * 拖动 source/target 端点到新端口，更新边并触发 edge-update
 */

import { type Ref, ref } from 'vue';
import { validateConnection } from '../utils/validation-utils';
import type { FlowConfig, FlowEdge, FlowNode } from '../types';

export type EdgeReconnectEndpoint = 'source' | 'target';

export interface EdgeReconnectDraft {
  edgeId: string;
  endpoint: EdgeReconnectEndpoint;
}

export interface UseEdgeReconnectOptions {
  config: Ref<Readonly<FlowConfig>>;
  nodes: Ref<FlowNode[]>;
  edges: Ref<FlowEdge[]>;
  updateEdge: (edgeId: string, updates: Partial<FlowEdge>) => void;
  onEdgeUpdate?: (edge: FlowEdge) => void;
  onConnectReject?: (info: {
    sourceNodeId: string;
    sourceHandleId: string;
    targetNodeId: string;
    targetHandleId?: string;
    reason: 'invalid-connection' | 'duplicate' | 'self-loop';
  }) => void;
}

export interface UseEdgeReconnectReturn {
  edgeReconnectDraft: Ref<EdgeReconnectDraft | null>;
  isReconnecting: Ref<boolean>;
  handleEndpointMouseDown: (
    edge: FlowEdge,
    endpoint: EdgeReconnectEndpoint,
    event: MouseEvent
  ) => void;
  handleMouseMove: (event: MouseEvent) => void;
  handleMouseUp: (event: MouseEvent) => Promise<void>;
}

function isReconnectEnabled(config: FlowConfig): boolean {
  return config.edges?.reconnectable !== false;
}

/** 边端点重连 Hook */
export function useEdgeReconnect(options: UseEdgeReconnectOptions): UseEdgeReconnectReturn {
  const { config, edges, updateEdge, onEdgeUpdate, onConnectReject } = options;

  const edgeReconnectDraft = ref<EdgeReconnectDraft | null>(null);
  const isReconnecting = ref(false);

  const handleEndpointMouseDown = (
    edge: FlowEdge,
    endpoint: EdgeReconnectEndpoint,
    event: MouseEvent
  ) => {
    if (!isReconnectEnabled(config.value)) {
      return;
    }
    if (config.value.nodes?.connectable === false) {
      return;
    }

    edgeReconnectDraft.value = { edgeId: edge.id, endpoint };
    isReconnecting.value = true;
    event.stopPropagation();
    event.preventDefault();
  };

  const handleMouseMove = (_event: MouseEvent) => {
    // 最小实现：无预览线
  };

  const handleMouseUp = async (event: MouseEvent) => {
    const draft = edgeReconnectDraft.value;
    if (!draft) {
      return;
    }

    edgeReconnectDraft.value = null;
    isReconnecting.value = false;

    const edge = edges.value.find(e => e.id === draft.edgeId);
    if (!edge) {
      return;
    }

    const target = event.target as HTMLElement;
    const handleElement = target.closest('.flow-handle');
    if (!handleElement) {
      return;
    }

    const handleId = handleElement.getAttribute('data-handle-id');
    const handleType = handleElement.getAttribute('data-handle-type');
    const nodeId = handleElement.closest('.flow-node')?.getAttribute('data-node-id');

    if (!nodeId || !handleId || !handleType) {
      return;
    }

    const sourceNodeId = draft.endpoint === 'source' ? nodeId : edge.source;
    const targetNodeId = draft.endpoint === 'target' ? nodeId : edge.target;
    const sourceHandleId = draft.endpoint === 'source' ? handleId : (edge.sourceHandle ?? '');
    const targetHandleId = draft.endpoint === 'target' ? handleId : (edge.targetHandle ?? '');

    if (draft.endpoint === 'source' && handleType !== 'source') {
      return;
    }
    if (draft.endpoint === 'target' && handleType !== 'target') {
      return;
    }

    if (sourceNodeId === targetNodeId) {
      onConnectReject?.({
        sourceNodeId,
        sourceHandleId,
        targetNodeId,
        targetHandleId,
        reason: 'self-loop'
      });
      return;
    }

    const connection: Partial<FlowEdge> = {
      source: sourceNodeId,
      target: targetNodeId,
      sourceHandle: sourceHandleId,
      targetHandle: targetHandleId
    };

    const validation = await validateConnection(connection, config.value);
    if (!validation.valid) {
      onConnectReject?.({
        sourceNodeId,
        sourceHandleId,
        targetNodeId,
        targetHandleId,
        reason: 'invalid-connection'
      });
      return;
    }

    const duplicate = edges.value.some(
      e =>
        e.id !== edge.id &&
        e.source === sourceNodeId &&
        e.target === targetNodeId &&
        (e.sourceHandle ?? '') === (sourceHandleId ?? '') &&
        (e.targetHandle ?? '') === (targetHandleId ?? '')
    );
    if (duplicate) {
      onConnectReject?.({
        sourceNodeId,
        sourceHandleId,
        targetNodeId,
        targetHandleId,
        reason: 'duplicate'
      });
      return;
    }

    const updates: Partial<FlowEdge> =
      draft.endpoint === 'source'
        ? { source: nodeId, sourceHandle: handleId }
        : { target: nodeId, targetHandle: handleId };

    updateEdge(edge.id, updates);
    const updated: FlowEdge = { ...edge, ...updates };
    onEdgeUpdate?.(updated);
  };

  return {
    edgeReconnectDraft,
    isReconnecting,
    handleEndpointMouseDown,
    handleMouseMove,
    handleMouseUp
  };
}
