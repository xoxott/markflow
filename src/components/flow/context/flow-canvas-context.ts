/**
 * FlowCanvas 注入上下文
 *
 * 供子组件与插件通过 inject 访问画布状态，减少 prop 贯穿
 */

import type { InjectionKey, Ref } from 'vue';
import type { FlowConfig, FlowEdge, FlowNode, FlowViewport } from '../types';

/** 选择子上下文：当前选中的节点/边 ID + 写操作 */
export interface FlowSelectionContext {
  selectedNodeIds: Ref<string[]>;
  selectedEdgeIds: Ref<string[]>;
  selectNode: (id: string, multi?: boolean) => void;
  selectNodes: (ids: string[]) => void;
  selectEdge: (id: string, multi?: boolean) => void;
  deselectAll: () => void;
}

/** 视口动作子上下文：通用视口写操作（pan/zoom/fit） */
export interface FlowViewportActions {
  setViewport: (viewport: Partial<FlowViewport>) => void;
  panViewport: (deltaX: number, deltaY: number) => void;
  zoomViewport: (zoom: number, centerX?: number, centerY?: number) => void;
  fitView: (padding?: number) => boolean;
}

export interface FlowCanvasContextValue {
  config: Ref<Readonly<FlowConfig>>;
  /** 画布内节点列表（与 store 同步，小地图等应 inject 此 ref） */
  nodes: Ref<FlowNode[]>;
  /** 画布内连接线列表 */
  edges: Ref<FlowEdge[]>;
  viewport: Ref<FlowViewport>;
  canvasRef: Ref<HTMLElement | null>;
  stableViewport: Ref<FlowViewport>;
  /** 画布 DOM 当前尺寸（由 ResizeObserver 维护），供视口裁剪等使用 */
  canvasSize: Ref<{ width: number; height: number }>;
  nodesMap: Ref<Map<string, FlowNode>>;
  getNodeById: (id: string) => FlowNode | undefined;
  draggingNodeId: Ref<string | null>;
  isPanning: Ref<boolean>;
  instanceId: Ref<string>;
  /** 与画布 store 同步的视口写入（小地图、工具栏等） */
  setViewport: (viewport: Partial<FlowViewport>) => void;
  getViewport: () => FlowViewport;
  /** 选择子上下文（Phase 2 新增） */
  selection: FlowSelectionContext;
  /** 视口动作子上下文（Phase 2 新增） */
  viewportActions: FlowViewportActions;
  /** 布局是否锁定（锁定后仅可平移/缩放画布） */
  layoutLocked: Ref<boolean>;
  setLayoutLocked: (locked: boolean) => void;
  toggleLayoutLock: () => void;
  /** 显示 / 隐藏画布刻度尺 */
  setShowRuler: (show: boolean) => void;
  toggleShowRuler: () => void;
  /** 开启 / 关闭拖拽对齐参考线（网格 / 辅助线 / 节点对齐） */
  setDragSnapGuidesEnabled: (enabled: boolean) => void;
  toggleDragSnapGuidesEnabled: () => void;
}

export const flowCanvasContextKey: InjectionKey<FlowCanvasContextValue> =
  Symbol('flowCanvasContext');
