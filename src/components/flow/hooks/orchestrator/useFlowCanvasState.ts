/** FlowCanvas 状态层：flowState + guides + registry 合并 */

import type { ComputedRef, Ref } from 'vue';
import { computed } from 'vue';
import type { FlowConfig, FlowEdge, FlowNode } from '../../types';
import type { FlowCanvasProps } from '../../types/flow-canvas';
import type { FlowCanvasEmit } from '../../types/flow-events';
import { useFlowState } from '../useFlowState';
import { useFlowGuides } from '../useFlowGuides';
import { useNodesMap } from '../useNodesMap';

export interface UseFlowCanvasStateOptions {
  props: Readonly<
    Pick<FlowCanvasProps, 'initialNodes' | 'initialEdges' | 'initialViewport' | 'initialGuides'>
  >;
  config: Ref<Readonly<FlowConfig>>;
  emit: FlowCanvasEmit;
  canvasRef: Ref<HTMLElement | null>;
}

export function useFlowCanvasState(options: UseFlowCanvasStateOptions) {
  const { props, config, emit, canvasRef } = options;

  const flowState = useFlowState({
    initialNodes: props.initialNodes,
    initialEdges: props.initialEdges,
    initialViewport: props.initialViewport,
    maxHistorySize: config.value.performance?.maxHistorySize || 50,
    selectionOptions: {
      enableMultiSelection: config.value.interaction?.enableMultiSelection !== false,
      multiSelectKey: config.value.interaction?.multiSelectKey || 'ctrl',
      enableBoxSelection: config.value.interaction?.enableBoxSelection !== false,
      boxSelectionKey: config.value.interaction?.boxSelectionKey || 'shift'
    }
  });

  const { nodes, viewport } = flowState;

  /**
   * Phase 4：addNode/addEdge 合并 nodeTypes / edgeTypes 注册项的 defaultConfig
   *
   * 合并顺序：defaultConfig < 传入的 node
   */
  const mergeNodeWithRegistry = (node: FlowNode): FlowNode => {
    const registry = config.value.nodes?.nodeTypes;
    if (!registry) return node;
    const entry = registry[node.type];
    if (!entry || typeof entry !== 'object' || !('defaultConfig' in entry)) {
      return node;
    }
    const defaults = (entry as { defaultConfig?: Partial<FlowNode> }).defaultConfig;
    if (!defaults) return node;
    return {
      ...defaults,
      ...node,
      data: { ...(defaults.data ?? {}), ...(node.data ?? {}) },
      style: { ...(defaults.style ?? {}), ...(node.style ?? {}) }
    };
  };

  const mergeEdgeWithRegistry = (edge: FlowEdge): FlowEdge => {
    const registry = config.value.edges?.edgeTypes;
    if (!registry) return edge;
    const entry = registry[edge.type ?? 'default'];
    if (!entry || typeof entry !== 'object' || !('defaultConfig' in entry)) {
      return edge;
    }
    const defaults = (entry as { defaultConfig?: Partial<FlowEdge> }).defaultConfig;
    if (!defaults) return edge;
    return {
      ...defaults,
      ...edge,
      data: { ...(defaults.data ?? {}), ...(edge.data ?? {}) },
      style: { ...(defaults.style ?? {}), ...(edge.style ?? {}) }
    };
  };

  const addNode = (node: FlowNode) => flowState.addNode(mergeNodeWithRegistry(node));
  const addEdge = (edge: FlowEdge) => flowState.addEdge(mergeEdgeWithRegistry(edge));

  const guidesManager = useFlowGuides({
    config,
    viewport,
    canvasRef,
    initialGuides: props.initialGuides,
    onGuidesChange: guides => {
      emit('guides-change', guides);
      emit('update:guides', guides);
    }
  });

  const lockedNodeIds: ComputedRef<string[]> = computed(() =>
    nodes.value.filter(n => n.locked === true).map(n => n.id)
  );

  const { nodesMap } = useNodesMap({ nodes });
  const getNodeById = (id: string) => nodesMap.value.get(id);

  return {
    flowState,
    guidesManager,
    lockedNodeIds,
    addNode,
    addEdge,
    nodesMap,
    getNodeById
  };
}

export type UseFlowCanvasStateReturn = ReturnType<typeof useFlowCanvasState>;
