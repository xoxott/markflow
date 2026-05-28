/**
 * Flow 主画布组件
 *
 * 整合所有功能的核心画布组件，提供完整的图形编辑器功能
 *
 * 注意：组件本身不再隐式加载样式。宿主在应用入口（main.ts/App.tsx）执行一次 `import '@/components/flow/styles';` 即可启用 Flow 主题。详见
 * src/components/flow/styles.ts。
 */

import type { CSSProperties, PropType } from 'vue';
import { computed, defineComponent, provide } from 'vue';
import { type FlowCanvasEmit, useFlowCanvasCore } from '../hooks/useFlowCanvasCore';
import { useFlowCanvasTheme } from '../hooks/useFlowCanvasTheme';
import { useFlowI18n } from '../hooks/useFlowI18n';
import type { FlowCanvasProps } from '../types/flow-canvas';
import type { FlowEdge, FlowGuideLine, FlowNode, FlowViewport } from '../types';
import { flowCanvasContextKey } from '../context/flow-canvas-context';
import FlowNodes from './FlowNodes';
import FlowEdges from './FlowEdges';
import FlowBackground from './FlowBackground';
import FlowRuler from './FlowRuler';
import FlowGuideLines from './FlowGuideLines';
import FlowSnapGuides from './FlowSnapGuides';
import FlowAlignmentGuides from './FlowAlignmentGuides';
import FlowSelectionBox from './FlowSelectionBox';
import FlowViewportContainer from './FlowViewportContainer';
import ConnectionPreview from './ConnectionPreview';
import FlowContextMenu from './FlowContextMenu';

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
    nodes: {
      type: Array as PropType<FlowNode[]>,
      default: undefined
    },
    edges: {
      type: Array as PropType<FlowEdge[]>,
      default: undefined
    },
    viewport: {
      type: Object as PropType<FlowViewport>,
      default: undefined
    },
    selection: {
      type: Object as PropType<{ nodeIds: string[]; edgeIds: string[] }>,
      default: undefined
    },
    guides: {
      type: Array as PropType<FlowGuideLine[]>,
      default: undefined
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
    'edge-update',
    'connect-reject',
    'viewport-change',
    'guides-change',
    // Phase 3：受控/双绑 update:* + 集合变化
    'update:nodes',
    'update:edges',
    'update:viewport',
    'update:selection',
    'update:guides',
    'nodes-change',
    'edges-change',
    'selection-change'
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

    const { t } = useFlowI18n({ config: core.config });

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
      edges: core.edges,
      viewport: core.viewport,
      canvasRef: core.canvasRef,
      canvasSize: core.canvasSize,
      stableViewport: core.stableViewportRef,
      nodesMap: core.nodesMap,
      getNodeById: core.getNodeById,
      draggingNodeId: core.draggingNodeId,
      isPanning: core.isPanning,
      instanceId: core.defaultInstanceId,
      setViewport: core.setViewport,
      getViewport: () => core.viewport.value,
      selection: {
        selectedNodeIds: core.selectedNodeIds,
        selectedEdgeIds: core.selectedEdgeIds,
        selectNode: core.selectNode,
        selectNodes: core.selectNodes,
        selectEdge: core.selectEdge,
        deselectAll: core.deselectAll
      },
      viewportActions: {
        setViewport: core.setViewport,
        panViewport: core.panViewport,
        zoomViewport: core.zoomViewport,
        fitView: core.fitView
      },
      layoutLocked: core.layoutLocked,
      setLayoutLocked: core.setLayoutLocked,
      toggleLayoutLock: core.toggleLayoutLock,
      setShowRuler: core.setShowRuler,
      toggleShowRuler: core.toggleShowRuler,
      setDragSnapGuidesEnabled: core.setDragSnapGuidesEnabled,
      toggleDragSnapGuidesEnabled: core.toggleDragSnapGuidesEnabled
    });

    // Phase 3: 暴露 API 收敛到高频集合（≈ 17 项）
    // 内部/低频能力请改用：
    //  - `inject(flowCanvasContextKey)` 拿 `selection` / `viewportActions` / `eventEmitter` 等
    //  - `useFlowConfig` 拿 config / updateConfig
    //  - `useFlowState` 拿 box selection / guides 子 API
    expose({
      // 状态（Ref）
      nodes: core.nodes,
      edges: core.edges,
      viewport: core.viewport,
      selectedNodeIds: core.selectedNodeIds,
      selectedEdgeIds: core.selectedEdgeIds,
      // 节点/边写操作
      addNode: core.addNode,
      updateNode: core.updateNode,
      removeNode: core.removeNode,
      addEdge: core.addEdge,
      removeEdge: core.removeEdge,
      // 视口
      setViewport: core.setViewport,
      zoomViewport: core.zoomViewport,
      fitView: core.fitView,
      // 选择
      selectNode: core.selectNode,
      deselectAll: core.deselectAll,
      // 历史
      undo: core.undo,
      redo: core.redo,
      canUndo: core.canUndo,
      canRedo: core.canRedo,
      // 序列化 / 剪贴板（Phase 5.3）
      exportJSON: core.exportJSON,
      importJSON: core.importJSON,
      copySelection: core.copySelection,
      cutSelection: core.cutSelection,
      pasteClipboard: core.pasteClipboard,
      // 布局锁定
      layoutLocked: core.layoutLocked,
      setLayoutLocked: core.setLayoutLocked,
      toggleLayoutLock: core.toggleLayoutLock,
      // 刻度尺
      setShowRuler: core.setShowRuler,
      toggleShowRuler: core.toggleShowRuler,
      // 拖拽对齐参考线
      setDragSnapGuidesEnabled: core.setDragSnapGuidesEnabled,
      toggleDragSnapGuidesEnabled: core.toggleDragSnapGuidesEnabled
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
        role="application"
        aria-label={t('canvas.ariaLabel')}
        tabindex={-1}
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
            lockedNodeIds={core.lockedNodeIds.value}
            elevatedNodeIds={core.elevatedNodeIds.value}
            allocateZIndex={core.allocateZIndex}
            removeZIndex={core.removeZIndex}
            onNodeClick={core.handleNodeClick}
            onNodeDoubleClick={core.handleNodeDoubleClick}
            onNodeMouseDown={core.handleNodeMouseDown}
            onPortMouseDown={core.handlePortMouseDown}
          >
            {{ node: slots.node }}
          </FlowNodes>
        </FlowViewportContainer>

        {showSnapGuides.value && (
          <FlowSnapGuides
            viewport={core.viewport.value}
            snapGuide={dragSnapGuide.value}
            visible={Boolean(core.draggingNodeId.value)}
          />
        )}

        {core.config.value.canvas?.snapToAlignment !== false && (
          <FlowAlignmentGuides
            viewport={core.viewport.value}
            guides={core.alignmentGuides.value}
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
          onEdgeEndpointMouseDown={core.handleEdgeEndpointMouseDown}
        />

        {/* Phase 4.4：扩展槽位 */}
        {slots.toolbar?.({
          viewport: core.viewport.value,
          canUndo: core.canUndo.value,
          canRedo: core.canRedo.value,
          undo: core.undo,
          redo: core.redo,
          fitView: core.fitView
        })}
        {slots.minimap?.({
          nodes: core.nodes.value,
          viewport: core.viewport.value
        })}
        {slots.overlays?.({
          viewport: core.viewport.value,
          nodes: core.nodes.value,
          edges: core.edges.value,
          selectedNodeIds: core.selectedNodeIds.value,
          selectedEdgeIds: core.selectedEdgeIds.value
        })}
        {core.nodes.value.length === 0 && core.edges.value.length === 0 && slots.emptyState?.()}

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

        {/* Phase 5.1：框选矩形（屏幕坐标已减去画布偏移） */}
        {(() => {
          const box = core.selectionBoxState.value;
          if (!box.visible) return null;
          const rect = core.canvasRef.value?.getBoundingClientRect();
          const offsetX = rect?.left ?? 0;
          const offsetY = rect?.top ?? 0;
          return (
            <FlowSelectionBox
              visible={box.visible}
              startX={box.startX - offsetX}
              startY={box.startY - offsetY}
              currentX={box.currentX - offsetX}
              currentY={box.currentY - offsetY}
            />
          );
        })()}

        {slots.default && slots.default()}

        {core.config.value.interaction?.enableContextMenu !== false && (
          <FlowContextMenu
            canvasRef={core.canvasRef}
            config={core.config}
            nodes={core.nodes}
            edges={core.edges}
            selectedNodeIds={core.selectedNodeIds}
            selectedEdgeIds={core.selectedEdgeIds}
            getNodeById={core.getNodeById}
            selectNode={core.selectNode}
            selectEdge={core.selectEdge}
            deselectAll={core.deselectAll}
            removeNode={core.removeNode}
            removeEdge={core.removeEdge}
            copySelection={core.copySelection}
            cutSelection={core.cutSelection}
            pasteClipboard={core.pasteClipboard}
          />
        )}
      </div>
    );
  }
});
