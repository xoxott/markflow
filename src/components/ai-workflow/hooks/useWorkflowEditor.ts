/**
 * AI 工作流编辑器状态编排
 *
 * 基于 FlowCanvas 暴露 API，不重复实现画布逻辑
 */

import { type Ref, computed, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { useMessage } from 'naive-ui';
import type { FlowEdge, FlowNode, FlowViewport } from '@/components/flow';
import { readExposedRef } from '@/components/flow/internal';
import {
  createFlowNodeAt,
  definitionToFlowState,
  flowStateToDefinition
} from '../adapters/flow-adapter';
import { WORKFLOW_DRAG_MIME } from '../constants/workflow-layout';
import { validateWorkflowGraph } from '../validation/validate-workflow';
import type { WorkflowFlowCanvasExpose, WorkflowNodeFlowData } from '../types/workflow-node-data';

export interface UseWorkflowEditorOptions {
  workflowId: Ref<string | undefined>;
  definition: Ref<Api.Workflow.WorkflowDefinition | undefined>;
  onSave?: (definition: Api.Workflow.WorkflowDefinition) => void | Promise<void>;
  onNodeSelect?: (node: Api.Workflow.WorkflowNode | null) => void;
}

export function useWorkflowEditor(options: UseWorkflowEditorOptions) {
  const message = useMessage();
  const canvasRef = shallowRef<WorkflowFlowCanvasExpose | null>(null);
  const isDirty = ref(false);
  const isSaving = ref(false);
  const lastValidation = ref<ReturnType<typeof validateWorkflowGraph> | null>(null);

  const defaultViewport: FlowViewport = { x: 0, y: 0, zoom: 1 };

  const selectedNode = computed<Api.Workflow.WorkflowNode | null>(() => {
    const api = canvasRef.value;
    const selectedIds = readExposedRef(api?.selectedNodeIds, [] as string[]);
    if (!selectedIds.length) return null;
    const id = selectedIds[0];
    const flowNodes = readExposedRef(api?.nodes, [] as FlowNode<WorkflowNodeFlowData>[]);
    const flowNode = flowNodes.find(n => n.id === id);
    if (!flowNode) return null;
    return {
      id: flowNode.id,
      type: flowNode.data.nodeType,
      name: flowNode.data.label,
      description: flowNode.data.description,
      position: { ...flowNode.position },
      config: flowNode.data.config,
      inputs: flowNode.data.inputs,
      outputs: flowNode.data.outputs
    };
  });

  function getCanvasApi(): WorkflowFlowCanvasExpose | null {
    return canvasRef.value;
  }

  function getDefinition(): Api.Workflow.WorkflowDefinition | null {
    const api = getCanvasApi();
    if (!api) return null;
    return flowStateToDefinition(
      readExposedRef(api.nodes, [] as FlowNode<WorkflowNodeFlowData>[]),
      readExposedRef(api.edges, [] as FlowEdge[]),
      readExposedRef(api.viewport, defaultViewport)
    );
  }

  function markDirty() {
    isDirty.value = true;
  }

  function bindCanvas(instance: WorkflowFlowCanvasExpose | null) {
    canvasRef.value = instance;
  }

  function screenToFlowPosition(clientX: number, clientY: number, canvasEl: HTMLElement) {
    const rect = canvasEl.getBoundingClientRect();
    const api = getCanvasApi();
    const vp = readExposedRef(api?.viewport, defaultViewport);
    return {
      x: (clientX - rect.left - vp.x) / vp.zoom - 110,
      y: (clientY - rect.top - vp.y) / vp.zoom - 36
    };
  }

  function isLayoutLocked(): boolean {
    const api = getCanvasApi();
    return readExposedRef(api?.layoutLocked, false);
  }

  function handleDragOver(e: DragEvent) {
    if (!e.dataTransfer?.types.includes(WORKFLOW_DRAG_MIME)) return;
    if (isLayoutLocked()) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  function handleDrop(e: DragEvent, canvasEl: HTMLElement | null) {
    if (!canvasEl || !e.dataTransfer) return;
    const type = e.dataTransfer.getData(WORKFLOW_DRAG_MIME) as Api.Workflow.NodeType;
    if (!type) return;
    e.preventDefault();

    const api = getCanvasApi();
    if (!api) return;

    if (isLayoutLocked()) {
      message.warning('布局已锁定，请先解锁后再编辑节点');
      return;
    }

    const nodes = readExposedRef(api.nodes, [] as FlowNode<WorkflowNodeFlowData>[]);
    if (type === 'start' && nodes.some(n => n.data?.nodeType === 'start')) {
      message.warning('每个工作流只能有一个开始节点');
      return;
    }

    const position = screenToFlowPosition(e.clientX, e.clientY, canvasEl);
    api.addNode(createFlowNodeAt(type, position));
    markDirty();
  }

  function handleNodeClick(node: FlowNode<WorkflowNodeFlowData>) {
    const api = getCanvasApi();
    api?.selectNode(node.id);
    const d = node.data;
    options.onNodeSelect?.({
      id: node.id,
      type: d.nodeType,
      name: d.label,
      description: d.description,
      position: { ...node.position },
      config: d.config,
      inputs: d.inputs,
      outputs: d.outputs
    });
  }

  function handleConnect(_edge: FlowEdge) {
    markDirty();
  }

  function handleViewportChange() {
    markDirty();
  }

  function updateNode(nodeId: string, updates: Partial<Api.Workflow.WorkflowNode>) {
    const api = getCanvasApi();
    if (!api) return;

    const existing = readExposedRef(api.nodes, [] as FlowNode<WorkflowNodeFlowData>[]).find(
      n => n.id === nodeId
    );
    if (!existing) return;

    const data = { ...existing.data };
    if (updates.name !== undefined) data.label = updates.name;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.config !== undefined) data.config = updates.config;

    api.updateNode(nodeId, { data });
    markDirty();
    options.onNodeSelect?.(selectedNode.value);
  }

  async function save() {
    const def = getDefinition();
    if (!def || !options.onSave) return;

    const validation = validateWorkflowGraph(def.nodes, def.connections);
    lastValidation.value = validation;
    if (!validation.valid) {
      message.error(`校验未通过：${validation.errors[0]?.message ?? '存在错误'}`);
      return;
    }

    isSaving.value = true;
    try {
      await options.onSave(def);
      isDirty.value = false;
    } finally {
      isSaving.value = false;
    }
  }

  function validate() {
    const def = getDefinition();
    if (!def) return null;
    const result = validateWorkflowGraph(def.nodes, def.connections);
    lastValidation.value = result;
    if (result.valid && result.warnings.length === 0) {
      message.success('工作流校验通过');
    } else if (result.valid) {
      message.warning(`校验通过，有 ${result.warnings.length} 条警告`);
    } else {
      message.error(`校验失败：${result.errors[0]?.message}`);
    }
    return result;
  }

  function undo() {
    getCanvasApi()?.undo();
    markDirty();
  }

  function redo() {
    getCanvasApi()?.redo();
    markDirty();
  }

  function fitView() {
    getCanvasApi()?.fitView(0.2);
  }

  function clearCanvas() {
    const api = getCanvasApi();
    if (!api) return;
    [...readExposedRef(api.nodes, [] as FlowNode<WorkflowNodeFlowData>[])].forEach(n =>
      api.removeNode(n.id)
    );
    [...readExposedRef(api.edges, [] as FlowEdge[])].forEach(e => api.removeEdge(e.id));
    markDirty();
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      save();
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });

  const initialFlowState = computed(() => {
    const def = options.definition.value;
    if (!def) return { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
    return definitionToFlowState(def);
  });

  return {
    canvasRef,
    bindCanvas,
    initialFlowState,
    selectedNode,
    isDirty,
    isSaving,
    lastValidation,
    getDefinition,
    handleDragOver,
    handleDrop,
    handleNodeClick,
    handleConnect,
    handleViewportChange,
    updateNode,
    save,
    validate,
    undo,
    redo,
    fitView,
    clearCanvas
  };
}
