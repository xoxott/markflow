/**
 * Flow 主画布组件
 *
 * 整合所有功能的核心画布组件，提供完整的图形编辑器功能
 */

// 导入 Flow 主题样式（在使用 FlowCanvas 时自动加载）
import '../styles/index.scss';

import type { CSSProperties, PropType } from 'vue';
import { computed, defineComponent, provide } from 'vue';
import { type FlowCanvasEmit, useFlowCanvasCore } from '../hooks/useFlowCanvasCore';
import { useFlowCanvasTheme } from '../hooks/useFlowCanvasTheme';
import type { FlowCanvasProps } from '../types/flow-canvas';
import type { FlowEdge, FlowNode, FlowViewport } from '../types';
import { flowCanvasContextKey } from '../context/flow-canvas-context';
import FlowNodes from './FlowNodes';
import FlowEdges from './FlowEdges';
import FlowBackground from './FlowBackground';
import FlowViewportContainer from './FlowViewportContainer';
import ConnectionPreview from './ConnectionPreview';

export type { FlowCanvasProps } from '../types/flow-canvas';

/** Flow 主画布组件 */
export default defineComponent({
  name: 'FlowCanvas',
  props: {
    id: {
      type: String,
      default: undefined
    },
    config: {
      type: Object as PropType<FlowCanvasProps['config']>,
      default: () => ({})
    },
    initialNodes: {
      type: Array as PropType<FlowNode[]>,
      default: () => []
    },
    initialEdges: {
      type: Array as PropType<FlowEdge[]>,
      default: () => []
    },
    initialViewport: {
      type: Object as PropType<FlowViewport>,
      default: () => ({ x: 0, y: 0, zoom: 1 })
    },
    width: {
      type: [String, Number] as PropType<string | number>,
      default: '100%'
    },
    height: {
      type: [String, Number] as PropType<string | number>,
      default: '100%'
    },
    style: {
      type: Object as PropType<CSSProperties | Record<string, string | number>>,
      default: () => ({})
    },
    class: {
      type: String,
      default: ''
    },
    /** 跟随应用 Naive / themeStore 主题（默认 true） */
    syncAppTheme: {
      type: Boolean,
      default: true
    }
  },
  emits: [
    'node-click',
    'node-double-click',
    'edge-click',
    'edge-double-click',
    'connect',
    'viewport-change'
  ],
  setup(props, { emit, expose, slots }) {
    const core = useFlowCanvasCore({
      props,
      emit: emit as FlowCanvasEmit
    });

    const flowTheme = useFlowCanvasTheme({
      syncAppTheme: props.syncAppTheme,
      canvasRef: core.canvasRef
    });

    const canvasStyle = computed(() => {
      const fromCore = core.canvasStyle.value as CSSProperties;
      const themedBg = flowTheme.resolvedColors.value.backgroundColor;

      return {
        ...flowTheme.cssVars.value,
        ...fromCore,
        backgroundColor: fromCore.backgroundColor ?? themedBg
      };
    });

    provide(flowCanvasContextKey, {
      config: core.config,
      nodes: core.nodes,
      viewport: core.viewport,
      canvasRef: core.canvasRef,
      stableViewport: core.stableViewportRef,
      nodesMap: core.nodesMap,
      getNodeById: core.getNodeById,
      draggingNodeId: core.draggingNodeId,
      isPanning: core.isPanning,
      instanceId: core.defaultInstanceId,
      setViewport: core.setViewport,
      getViewport: () => core.viewport.value
    });

    expose({
      config: core.config,
      updateConfig: core.updateConfig,
      nodes: core.nodes,
      edges: core.edges,
      viewport: core.viewport,
      selectedNodeIds: core.selectedNodeIds,
      selectedEdgeIds: core.selectedEdgeIds,
      addNode: core.addNode,
      removeNode: core.removeNode,
      addEdge: core.addEdge,
      removeEdge: core.removeEdge,
      setViewport: core.setViewport,
      panViewport: core.panViewport,
      zoomViewport: core.zoomViewport,
      fitView: core.fitView,
      selectNode: core.selectNode,
      selectNodes: core.selectNodes,
      selectEdge: core.selectEdge,
      deselectAll: core.deselectAll,
      startBoxSelection: core.startBoxSelection,
      updateBoxSelection: core.updateBoxSelection,
      finishBoxSelection: core.finishBoxSelection,
      cancelBoxSelection: core.cancelBoxSelection,
      isBoxSelecting: core.isBoxSelecting,
      registerKeyboardShortcut: core.registerKeyboardShortcut,
      unregisterKeyboardShortcut: core.unregisterKeyboardShortcut,
      eventEmitter: core.eventEmitter
    });

    return () => (
      <div
        ref={core.canvasRef}
        class={['flow-canvas', flowTheme.themeClass.value, props.class]}
        style={canvasStyle.value}
      >
        {slots.background
          ? slots.background({ viewport: core.viewport.value })
          : core.config.value.canvas?.showGrid !== false && (
              <FlowBackground
                showGrid={core.config.value.canvas?.showGrid}
                gridType={core.config.value.canvas?.gridType || 'dots'}
                gridSize={core.config.value.canvas?.gridSize || 20}
                gridColor={
                  core.config.value.canvas?.gridColor ?? flowTheme.resolvedColors.value.gridColor
                }
                gridOpacity={
                  core.config.value.canvas?.gridOpacity ??
                  flowTheme.resolvedColors.value.gridOpacity
                }
                backgroundColor={
                  core.config.value.canvas?.backgroundColor ??
                  flowTheme.resolvedColors.value.backgroundColor
                }
                viewport={core.stableViewportRef.value}
                instanceId={core.defaultInstanceId.value}
                isPanning={core.isPanning.value}
              />
            )}

        <FlowViewportContainer viewport={core.viewport.value}>
          <FlowNodes
            nodes={core.nodes.value}
            selectedNodeIds={core.selectedNodeIds.value}
            lockedNodeIds={core.emptyLockedNodeIds}
            elevatedNodeIds={core.elevatedNodeIds.value}
            allocateZIndex={core.allocateZIndex}
            removeZIndex={core.removeZIndex}
            onNodeClick={core.handleNodeClick}
            onNodeDoubleClick={core.handleNodeDoubleClick}
            onNodeMouseDown={core.handleNodeMouseDown}
            onPortMouseDown={core.handlePortMouseDown}
          />
        </FlowViewportContainer>

        <FlowEdges
          edges={core.edges.value}
          nodes={core.nodes.value}
          selectedEdgeIds={core.selectedEdgeIds.value}
          onEdgeClick={core.handleEdgeClick}
          onEdgeDoubleClick={core.handleEdgeDoubleClick}
        />

        {core.connectionDraft.value && core.connectionPreviewPos.value && (
          <ConnectionPreview
            sourceNodeId={core.connectionDraft.value.sourceNodeId}
            sourceHandleId={core.connectionDraft.value.sourceHandleId}
            previewPos={core.connectionPreviewPos.value}
            getNodeById={core.getNodeById}
            viewport={core.viewport.value}
            canvasRef={core.canvasRef.value}
          />
        )}

        {slots.default && slots.default()}
      </div>
    );
  }
});
