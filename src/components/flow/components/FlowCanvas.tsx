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
import type { FlowEdge, FlowGuideLine, FlowNode, FlowViewport } from '../types';
import { flowCanvasContextKey } from '../context/flow-canvas-context';
import FlowNodes from './FlowNodes';
import FlowEdges from './FlowEdges';
import FlowBackground from './FlowBackground';
import FlowRuler from './FlowRuler';
import FlowGuideLines from './FlowGuideLines';
import FlowSnapGuides from './FlowSnapGuides';
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
    initialGuides: {
      type: Array as PropType<FlowGuideLine[]>,
      default: () => []
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
    'viewport-change',
    'guides-change'
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
      getViewport: () => core.viewport.value,
      layoutLocked: core.layoutLocked,
      setLayoutLocked: core.setLayoutLocked,
      toggleLayoutLock: core.toggleLayoutLock
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
      updateNode: core.updateNode,
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
      undo: core.undo,
      redo: core.redo,
      canUndo: core.canUndo,
      canRedo: core.canRedo,
      startBoxSelection: core.startBoxSelection,
      updateBoxSelection: core.updateBoxSelection,
      finishBoxSelection: core.finishBoxSelection,
      cancelBoxSelection: core.cancelBoxSelection,
      isBoxSelecting: core.isBoxSelecting,
      registerKeyboardShortcut: core.registerKeyboardShortcut,
      unregisterKeyboardShortcut: core.unregisterKeyboardShortcut,
      guides: core.guides,
      setGuides: core.setGuides,
      clearGuides: core.clearGuides,
      removeGuide: core.removeGuide,
      eventEmitter: core.eventEmitter,
      layoutLocked: core.layoutLocked,
      setLayoutLocked: core.setLayoutLocked,
      toggleLayoutLock: core.toggleLayoutLock
    });

    const showSnapGuides = computed(() => {
      const canvas = core.config.value.canvas;
      if (canvas?.showSnapGuides === false) {
        return false;
      }
      return Boolean(canvas?.snapToGrid) || canvas?.snapToGuides !== false;
    });

    const showGuideLines = computed(() => {
      const canvas = core.config.value.canvas;
      return Boolean(canvas?.showRuler) && canvas?.enableGuides !== false;
    });

    /** 拖拽时用节点实际位置作指示，与画布参考线 / 刻度尺保持一致 */
    const dragSnapGuide = computed(() => {
      const draggingId = core.draggingNodeId.value;
      if (draggingId) {
        const node = core.getNodeById(draggingId);
        if (node) {
          return node.position;
        }
      }
      return core.snapGuidePosition.value;
    });

    return () => (
      <div
        ref={core.canvasRef}
        class={[
          'flow-canvas',
          flowTheme.themeClass.value,
          core.layoutLocked.value && 'flow-canvas--layout-locked',
          props.class
        ]}
        style={canvasStyle.value}
        tabIndex={-1}
        onMousedown={(event: MouseEvent) => {
          const target = event.target as HTMLElement;
          if (target.closest('input, textarea, select, [contenteditable="true"]')) {
            return;
          }
          core.canvasRef.value?.focus({ preventScroll: true });
        }}
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
                viewport={core.viewport.value}
                instanceId={core.defaultInstanceId.value}
                isPanning={core.isPanning.value}
              />
            )}

        {core.config.value.canvas?.showRuler && (
          <FlowRuler
            viewport={core.viewport.value}
            config={core.config.value}
            snapGuide={dragSnapGuide.value}
            onRulerPointerDown={core.handleRulerPointerDown}
          />
        )}

        <FlowViewportContainer viewport={core.viewport.value}>
          {showGuideLines.value && (
            <FlowGuideLines
              viewport={core.viewport.value}
              guides={core.guides.value}
              draftGuide={core.draftGuide.value}
              onGuidePointerDown={core.handleGuidePointerDown}
              onGuideDoubleClick={core.handleGuideDoubleClick}
            />
          )}
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

        {showSnapGuides.value && (
          <FlowSnapGuides
            viewport={core.viewport.value}
            snapGuide={dragSnapGuide.value}
            visible={Boolean(core.draggingNodeId.value)}
          />
        )}

        <FlowEdges
          edges={core.edges.value}
          nodes={core.nodes.value}
          selectedEdgeIds={core.selectedEdgeIds.value}
          onEdgeClick={core.handleEdgeClick}
          onEdgeDoubleClick={core.handleEdgeDoubleClick}
          onEdgeDelete={core.handleEdgeDelete}
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
