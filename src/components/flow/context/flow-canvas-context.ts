/**
 * FlowCanvas 注入上下文
 *
 * 供子组件与插件通过 inject 访问画布状态，减少 prop 贯穿
 */

import type { InjectionKey, Ref } from 'vue';
import type { FlowConfig, FlowNode, FlowViewport } from '../types';

export interface FlowCanvasContextValue {
  config: Ref<Readonly<FlowConfig>>;
  /** 画布内节点列表（与 store 同步，小地图等应 inject 此 ref） */
  nodes: Ref<FlowNode[]>;
  viewport: Ref<FlowViewport>;
  canvasRef: Ref<HTMLElement | null>;
  stableViewport: Ref<FlowViewport>;
  nodesMap: Ref<Map<string, FlowNode>>;
  getNodeById: (id: string) => FlowNode | undefined;
  draggingNodeId: Ref<string | null>;
  isPanning: Ref<boolean>;
  instanceId: Ref<string>;
  /** 与画布 store 同步的视口写入（小地图、工具栏等） */
  setViewport: (viewport: Partial<FlowViewport>) => void;
  getViewport: () => FlowViewport;
  /** 布局是否锁定（锁定后仅可平移/缩放画布） */
  layoutLocked: Ref<boolean>;
  setLayoutLocked: (locked: boolean) => void;
  toggleLayoutLock: () => void;
}

export const flowCanvasContextKey: InjectionKey<FlowCanvasContextValue> =
  Symbol('flowCanvasContext');
