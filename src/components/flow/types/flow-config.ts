/**
 * Flow 核心配置类型定义
 *
 * 定义图形编辑器的完整配置接口，类似 VueFlow/ReactFlow 支持工作流、流程图等多种场景
 */

import type { Component } from 'vue';
import type { FlowNodeType } from './flow-node';
import type { FlowEdge, FlowEdgePathGenerator, FlowEdgeType } from './flow-edge';

// 注意：删除了下列死字段（既无消费方，也未在文档中作为公开 API 暴露）：
// - canvas.fitViewOnResize（无实现）
// - canvas.zoomOnDoubleClick（无实现）
// - interaction.enableContextMenu / connectOnClick / connectionMode（无实现）
// - performance.enableVirtualScroll / virtualScrollBuffer（已被 enableViewportCulling 取代）
// - FlowConfig 顶层的 toolbar / minimap / emptyState / background（用 slot 方式扩展）

/** 视口配置 */
export interface FlowViewport {
  /** 水平偏移 */
  x: number;
  /** 垂直偏移 */
  y: number;
  /** 缩放比例 */
  zoom: number;
}

/** 网格类型 */
export type FlowGridType = 'dots' | 'lines' | 'cross' | 'none';

/** 画布配置 */
export interface FlowCanvasConfig {
  /** 最小缩放比例 */
  minZoom?: number;
  /** 最大缩放比例 */
  maxZoom?: number;
  /** 默认缩放比例 */
  defaultZoom?: number;
  /** 缩放步长 */
  zoomStep?: number;
  /** 是否启用网格 */
  showGrid?: boolean;
  /** 网格类型 */
  gridType?: FlowGridType;
  /** 网格大小（像素） */
  gridSize?: number;
  /** 网格颜色 */
  gridColor?: string;
  /** 网格透明度 */
  gridOpacity?: number;
  /** 背景颜色 */
  backgroundColor?: string;
  /** 背景图片（可选） */
  backgroundImage?: string;
  /** 初始化时自动适应视图 */
  fitViewOnInit?: boolean;
  /** 适应视图时的边距 */
  fitViewPadding?: number | { x: number; y: number };
  /** 是否启用平移 */
  panOnDrag?: boolean | number[]; // true/false 或允许平移的鼠标按键数组 [0=左键, 1=中键, 2=右键]
  /** 是否启用滚轮缩放 */
  zoomOnScroll?: boolean;
  /** 是否启用双指缩放 */
  zoomOnPinch?: boolean;
  /** 是否显示刻度尺（顶部 + 左侧） */
  showRuler?: boolean;
  /** 刻度尺厚度（px） */
  rulerSize?: number;
  /** 拖拽节点时吸附到 gridSize 网格 */
  snapToGrid?: boolean;
  /** 吸附时显示对齐参考线（默认 true，需 snapToGrid） */
  showSnapGuides?: boolean;
  /** 允许从刻度尺拖出辅助线（默认 true，需 showRuler） */
  enableGuides?: boolean;
  /** 拖拽节点时吸附到用户辅助线 */
  snapToGuides?: boolean;
  /** 辅助线吸附阈值（画布坐标 px） */
  guideSnapThreshold?: number;
  /** 拖拽节点时吸附到其他节点的对齐线（左/右/中、上/下/中） */
  snapToAlignment?: boolean;
  /** 对齐吸附阈值（画布坐标 px，默认同 guideSnapThreshold） */
  alignmentSnapThreshold?: number;
}

/** 节点配置 */
export interface FlowNodeConfig {
  /** 默认宽度 */
  defaultWidth?: number;
  /** 默认高度 */
  defaultHeight?: number;
  /** 最小宽度 */
  minWidth?: number;
  /** 最小高度 */
  minHeight?: number;
  /** 边框圆角 */
  borderRadius?: number;
  /** 默认是否可拖拽 */
  draggable?: boolean;
  /** 默认是否可选择 */
  selectable?: boolean;
  /** 默认是否可连接 */
  connectable?: boolean;
  /** 默认是否可删除 */
  deletable?: boolean;
  /** 端口大小 */
  portSize?: number;
  /** 端口间距 */
  portSpacing?: number;
  /** 端口偏移 */
  portOffset?: number;
  /** 自定义节点类型注册表 */
  nodeTypes?: Record<string, FlowNodeType | Component>;
  /** 节点样式类名 */
  nodeClassName?: string;
  /** 是否在拖拽结束后保持节点在最顶层（性能优化：节点过多时可禁用） */
  elevateOnDragEnd?: boolean;
}

/**
 * 连接线类型
 *
 * 内置仅支持 `bezier` / `straight`；`default` 等价于 `bezier`。 其他形态（step / smoothstep / 自定义）请通过
 * `edges.edgePathGenerators` 或 `edges.edgeTypes` 注册扩展。
 */
export type FlowEdgeTypeName = 'bezier' | 'straight' | 'default';

/** 连接线配置 */
export interface FlowEdgeConfig {
  /** 默认连接线类型 */
  defaultType?: FlowEdgeTypeName;
  /** 默认描边宽度 */
  defaultStrokeWidth?: number;
  /** 默认描边颜色 */
  defaultStrokeColor?: string;
  /** 选中时描边宽度 */
  selectedStrokeWidth?: number;
  /** 选中时描边颜色 */
  selectedStrokeColor?: string;
  /** 悬停时描边宽度 */
  hoverStrokeWidth?: number;
  /** 悬停时描边颜色 */
  hoverStrokeColor?: string;
  /** 是否显示箭头 */
  showArrow?: boolean;
  /** 箭头大小 */
  arrowSize?: number;
  /** 点击区域宽度（用于提高点击体验） */
  clickAreaWidth?: number;
  /** 贝塞尔曲线控制点偏移比例（0-1之间，用于 bezier 类型，值越大弧度越大） */
  bezierControlOffset?: number;
  /** 动画持续时间（秒） */
  animationDuration?: number;
  /** 默认是否可选中 */
  selectable?: boolean;
  /** 默认是否可删除 */
  deletable?: boolean;
  /** 默认是否启用动画 */
  animated?: boolean;
  /** 自定义连接线类型注册表 */
  edgeTypes?: Record<string, FlowEdgeType | Component>;
  /** 自定义路径生成器 */
  edgePathGenerators?: Record<string, FlowEdgePathGenerator>;
  /** 连接线样式类名 */
  edgeClassName?: string;
  /** 连接线是否渲染在节点后面（z-index 更低），默认为 true */
  renderBehindNodes?: boolean;
  /** 选中时在连接线上显示删除按钮 */
  showDeleteButtonOnSelect?: boolean;
  /** 删除按钮直径（屏幕像素） */
  deleteButtonSize?: number;
  /** 选中边时是否允许拖拽端点重连（默认 true） */
  reconnectable?: boolean;
  /** 标签默认字号（px） */
  labelFontSize?: number;
  /** 标签默认是否显示背景（提高可读性） */
  labelShowBackground?: boolean;
  /** 标签背景内边距（px） */
  labelBackgroundPadding?: number;
  /** 标签背景圆角（px） */
  labelBackgroundRadius?: number;
}

/** 交互配置 */
export interface FlowInteractionConfig {
  /** 是否启用多选 */
  enableMultiSelection?: boolean;
  /** 多选快捷键 */
  multiSelectKey?: 'ctrl' | 'shift' | 'meta' | 'alt';
  /** 是否启用框选 */
  enableBoxSelection?: boolean;
  /** 框选快捷键 */
  boxSelectionKey?: 'shift' | 'alt' | 'ctrl';
  /** 是否启用拖拽画布 */
  enableCanvasPan?: boolean;
  /** 是否启用滚轮缩放 */
  enableWheelZoom?: boolean;
  /** 拖拽阈值（像素，超过此值才开始拖拽） */
  dragThreshold?: number;
  /** 双击延迟（毫秒） */
  doubleClickDelay?: number;
  /** 是否启用节点拖拽 */
  nodesDraggable?: boolean;
  /** 是否启用节点连接 */
  nodesConnectable?: boolean;
  /** 是否启用节点选择 */
  nodesSelectable?: boolean;
  /** 是否启用连接线选择 */
  edgesSelectable?: boolean;
  /** 是否启用连接线删除 */
  edgesDeletable?: boolean;
}

/** 性能配置 */
export interface FlowPerformanceConfig {
  /** 是否启用 RAF 节流 */
  enableRAFThrottle?: boolean;
  /** 是否启用视口裁剪（只渲染可见区域） */
  enableViewportCulling?: boolean;
  /** 是否启用 GPU 加速 */
  enableGPUAcceleration?: boolean;
  /** 是否启用连接线 Canvas 渲染（大量连接线时性能更好） */
  enableEdgeCanvasRendering?: boolean;
  /** Canvas 渲染阈值（连接线数量超过此值使用 Canvas） */
  edgeCanvasThreshold?: number;
  /** 历史记录最大数量 */
  maxHistorySize?: number;
  /** 是否启用配置缓存 */
  enableConfigCache?: boolean;
  /** 缓存大小限制 */
  cacheSizeLimit?: number;
}

/** Flow 内置文案语言 */
export type FlowLocale = 'zh-CN' | 'en-US';

/** 主题配置 */
export interface FlowThemeConfig {
  /** 内置 i18n 语言（可被顶层 locale 覆盖） */
  locale?: FlowLocale;
  /** 主题模式 */
  mode?: 'light' | 'dark' | 'auto';
  /** 主色调 */
  primaryColor?: string;
  /** 成功色 */
  successColor?: string;
  /** 警告色 */
  warningColor?: string;
  /** 错误色 */
  errorColor?: string;
  /** 信息色 */
  infoColor?: string;
  /** 字体族 */
  fontFamily?: string;
  /** 字体大小 */
  fontSize?: number;
  /** 圆角大小 */
  borderRadius?: number;
  /** 阴影 */
  boxShadow?: string;
}

/** 验证函数类型 */
export type FlowValidationFunction = (
  connection: Partial<FlowEdge>
) => boolean | string | Promise<boolean | string>;

/**
 * 完整 Flow 配置
 *
 * 包含所有子配置和事件回调
 */
export interface FlowConfig {
  /** 内置 i18n 语言（toolbar / emptyState / a11y 文案） */
  locale?: FlowLocale;
  /** 画布配置 */
  canvas?: FlowCanvasConfig;
  /** 节点配置 */
  nodes?: FlowNodeConfig;
  /** 连接线配置 */
  edges?: FlowEdgeConfig;
  /** 交互配置 */
  interaction?: FlowInteractionConfig;
  /** 性能配置 */
  performance?: FlowPerformanceConfig;
  /** 主题配置 */
  theme?: FlowThemeConfig;
  /** 连接验证函数 */
  isValidConnection?: FlowValidationFunction;
  /** 初始视口 */
  initialViewport?: FlowViewport;
}

/** 部分配置类型（用于更新配置） */
export type PartialFlowConfig = {
  [K in keyof FlowConfig]?: Partial<FlowConfig[K]>;
};
