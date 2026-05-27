/**
 * Flow 默认配置
 *
 * 定义所有配置项的默认值 参考 VueFlow/ReactFlow 的最佳实践
 */

import type {
  FlowCanvasConfig,
  FlowConfig,
  FlowEdgeConfig,
  FlowInteractionConfig,
  FlowNodeConfig,
  FlowPerformanceConfig,
  FlowThemeConfig
} from '../types/flow-config';

/** 默认画布配置 */
export const DEFAULT_CANVAS_CONFIG: FlowCanvasConfig = {
  minZoom: 0.1,
  maxZoom: 4,
  defaultZoom: 1,
  zoomStep: 0.1,
  showGrid: true,
  gridType: 'dots',
  gridSize: 20,
  gridColor: undefined,
  gridOpacity: undefined,
  /** 不设默认值，由 syncAppTheme + --flow-background-color 决定 */
  backgroundColor: undefined,
  fitViewOnInit: false,
  fitViewPadding: 0.2,
  panOnDrag: true, // 允许左键拖拽
  zoomOnScroll: true,
  zoomOnPinch: true,
  showRuler: false,
  rulerSize: 24,
  snapToGrid: false,
  showSnapGuides: true,
  enableGuides: true,
  snapToGuides: true,
  guideSnapThreshold: 8,
  snapToAlignment: true,
  alignmentSnapThreshold: 8
};

/** 默认节点配置 */
export const DEFAULT_NODE_CONFIG: FlowNodeConfig = {
  defaultWidth: 220,
  defaultHeight: 72,
  minWidth: 180,
  minHeight: 60,
  borderRadius: 8,
  draggable: true,
  selectable: true,
  connectable: true,
  deletable: true,
  portSize: 20,
  portSpacing: 10,
  portOffset: 10,
  nodeTypes: {},
  elevateOnDragEnd: true // 默认启用，节点过多时可禁用以提升性能
};

/** 默认连接线配置 */
export const DEFAULT_EDGE_CONFIG: FlowEdgeConfig = {
  defaultType: 'bezier',
  defaultStrokeWidth: 2.5,
  defaultStrokeColor: '#cbd5e1',
  /** 与 defaultStrokeWidth 一致，选中仅改色不加粗 */
  selectedStrokeWidth: 2.5,
  /** 由 --flow-edge-selected / syncAppTheme 决定 */
  selectedStrokeColor: undefined,
  hoverStrokeWidth: 3,
  /** 与选中同色，由 --flow-edge-selected 决定 */
  hoverStrokeColor: undefined,
  showArrow: true,
  arrowSize: 10,
  clickAreaWidth: 24,
  bezierControlOffset: 0.5, // 贝塞尔曲线控制点偏移比例（0-1之间，值越大弧度越大）
  stepRadius: 10,
  animationDuration: 1.5,
  selectable: true,
  deletable: true,
  animated: false,
  edgeTypes: {},
  edgePathGenerators: {},
  renderBehindNodes: true, // 默认连接线在节点后面
  showDeleteButtonOnSelect: true,
  reconnectable: true,
  deleteButtonSize: 20,
  labelFontSize: 13,
  labelShowBackground: true,
  labelBackgroundPadding: 6,
  labelBackgroundRadius: 4
};

/** 默认交互配置 */
export const DEFAULT_INTERACTION_CONFIG: FlowInteractionConfig = {
  enableMultiSelection: true,
  multiSelectKey: 'ctrl',
  enableBoxSelection: true,
  boxSelectionKey: 'shift',
  enableCanvasPan: true,
  enableWheelZoom: true,
  dragThreshold: 3,
  doubleClickDelay: 300,
  nodesDraggable: true,
  nodesConnectable: true,
  nodesSelectable: true,
  edgesSelectable: true,
  edgesDeletable: true
};

/** 默认性能配置 */
export const DEFAULT_PERFORMANCE_CONFIG: FlowPerformanceConfig = {
  enableRAFThrottle: true,
  enableViewportCulling: true,
  enableGPUAcceleration: true,
  enableEdgeCanvasRendering: false,
  edgeCanvasThreshold: 200,
  maxHistorySize: 50,
  enableConfigCache: true,
  cacheSizeLimit: 100
};

/** 默认主题配置 */
export const DEFAULT_THEME_CONFIG: FlowThemeConfig = {
  locale: 'zh-CN',
  mode: 'light',
  primaryColor: '#2080f0',
  successColor: '#18a058',
  warningColor: '#f0a020',
  errorColor: '#d03050',
  infoColor: '#70c0e8',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: 14,
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
};

/** 默认完整配置 */
export const DEFAULT_FLOW_CONFIG: FlowConfig = {
  locale: 'zh-CN',
  canvas: DEFAULT_CANVAS_CONFIG,
  nodes: DEFAULT_NODE_CONFIG,
  edges: DEFAULT_EDGE_CONFIG,
  interaction: DEFAULT_INTERACTION_CONFIG,
  performance: DEFAULT_PERFORMANCE_CONFIG,
  theme: DEFAULT_THEME_CONFIG
};
