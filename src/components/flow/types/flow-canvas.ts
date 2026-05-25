/** FlowCanvas 与子组件共享类型 */

import type { FlowConfig, FlowEdge, FlowNode, FlowViewport } from './index';

/** FlowEdges 组件属性（与 FlowEdges.tsx 对齐） */
export interface FlowEdgesProps {
  edges: FlowEdge[];
  nodes: FlowNode[];
  selectedEdgeIds?: string[];
  viewport?: FlowViewport;
  instanceId?: string;
  enableViewportCulling?: boolean;
  enableCanvasRendering?: boolean;
  canvasThreshold?: number;
  config?: Readonly<FlowConfig>;
  isPanning?: boolean;
  draggingNodeId?: string | null;
  onEdgeClick?: (edge: FlowEdge, event: MouseEvent) => void;
  onEdgeDoubleClick?: (edge: FlowEdge, event: MouseEvent) => void;
  onEdgeMouseEnter?: (edge: FlowEdge, event: MouseEvent) => void;
  onEdgeMouseLeave?: (edge: FlowEdge, event: MouseEvent) => void;
}

/** FlowCanvas 组件属性 */
export interface FlowCanvasProps {
  /** 配置 ID（用于多实例） */
  id?: string;
  /** 初始配置 */
  config?: Partial<FlowConfig>;
  /** 初始节点列表 */
  initialNodes?: FlowNode[];
  /** 初始连接线列表 */
  initialEdges?: FlowEdge[];
  /** 初始视口 */
  initialViewport?: FlowViewport;
  /** 画布宽度 */
  width?: string | number;
  /** 画布高度 */
  height?: string | number;
  /** 自定义样式 */
  style?: Record<string, string | number> | import('vue').CSSProperties;
  /** CSS 类名 */
  class?: string;
  /** 跟随应用 Naive / themeStore 主题（默认 true） */
  syncAppTheme?: boolean;
}
