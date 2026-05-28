/**
 * Flow 公共 API 入口
 *
 * 设计原则：
 *
 * - 这里仅暴露 _稳定_ 的 public API，供宿主应用直接 `from '@/components/flow'`
 * - 内部工具/底层 Hook/状态管理实现/性能模块 _不_ 在此暴露
 * - 高级使用场景（插件/自定义节点/性能调优）需使用 deep import 或 `from '@/components/flow/internal'`
 *
 * 详见 `docs/EXTENSION_POINTS.md`（计划中）。
 */

// ---------------------------------------------------------------------------
// 类型（最常用）
// ---------------------------------------------------------------------------
export type {
  FlowPosition,
  FlowSize,
  FlowHandle,
  FlowNode,
  FlowNodeType,
  FlowEdge,
  FlowEdgeType,
  FlowEdgePathParams,
  FlowEdgePathGenerator,
  FlowCanvasProps,
  FlowGuideAxis,
  FlowGuideDraft,
  FlowGuideLine,
  FlowViewport,
  FlowGridType,
  FlowCanvasConfig,
  FlowNodeConfig,
  FlowEdgeTypeName,
  FlowEdgeConfig,
  FlowInteractionConfig,
  FlowPerformanceConfig,
  FlowThemeConfig,
  FlowLocale,
  FlowValidationFunction,
  FlowConfig,
  PartialFlowConfig,
  FlowNodeEvents,
  FlowEdgeEvents,
  FlowConnectionEvents,
  FlowCanvasEvents,
  FlowSelectionEvents,
  FlowViewportEvents,
  FlowDataEvents,
  FlowEvents,
  FlowPluginContext,
  FlowPlugin,
  FlowPluginConfig,
  DragTransformResult,
  CoordinateTransform
} from './types';

// ---------------------------------------------------------------------------
// Zod schemas 和验证函数
// ---------------------------------------------------------------------------
export {
  FlowPositionSchema,
  FlowSizeSchema,
  FlowHandleSchema,
  FlowNodeSchema,
  FlowEdgeSchema,
  FlowViewportSchema,
  FlowCanvasConfigSchema,
  FlowNodeConfigSchema,
  FlowEdgeConfigSchema,
  FlowInteractionConfigSchema,
  FlowPerformanceConfigSchema,
  FlowThemeConfigSchema,
  FlowConfigSchema,
  zodValidateNode,
  zodValidateEdge,
  zodValidateConfig,
  zodSafeValidateNode,
  zodSafeValidateEdge,
  zodSafeValidateConfig
} from './types';

// ---------------------------------------------------------------------------
// Context（用于子组件 inject）
// ---------------------------------------------------------------------------
export { flowCanvasContextKey, type FlowCanvasContextValue } from './context/flow-canvas-context';
export { flowDarkModeKey, useFlowDarkMode } from './context/flow-theme-context';

// ---------------------------------------------------------------------------
// 顶层组件（业务最常用）
// ---------------------------------------------------------------------------
export { default as FlowCanvas } from './components/FlowCanvas';
export { default as FlowMinimap } from './components/FlowMinimap';
export { default as FlowToolbar } from './components/FlowToolbar';
export { default as FlowEmptyState } from './components/FlowEmptyState';
export { default as FlowPerformanceMonitor } from './components/FlowPerformanceMonitor';
export { default as FlowContextMenu } from './components/FlowContextMenu';
export type { FlowContextMenuProps } from './components/FlowContextMenu';
export type {
  FlowMinimapProps,
  MinimapPosition,
  MinimapSize,
  MinimapTheme,
  ResolveMinimapNodeColor,
  FlowToolbarProps,
  FlowEmptyStateProps
} from './components';

// 自定义节点 / 自定义边的兜底组件
export { default as BaseNode } from './components/nodes/BaseNode';
export { default as BaseEdge } from './components/edges/BaseEdge';
export { default as ConnectionPreview } from './components/ConnectionPreview';
export type { ConnectionPreviewProps } from './components/ConnectionPreview';

// ---------------------------------------------------------------------------
// 配置
// ---------------------------------------------------------------------------
export { DEFAULT_FLOW_CONFIG } from './config/default-config';
export { FlowConfigManager, getGlobalConfigManager } from './config/FlowConfigManager';
export { FlowConfigValidator } from './config/FlowConfigValidator';

// ---------------------------------------------------------------------------
// 用户级 Hook（业务直接用）
// ---------------------------------------------------------------------------
export { useFlowConfig } from './hooks/useFlowConfig';
export { useFlowCanvasContext } from './hooks/useFlowCanvasContext';
export { useFlowI18n } from './hooks/useFlowI18n';
export type { FlowI18nMessages, FlowI18nKey } from './i18n';

// ---------------------------------------------------------------------------
// 扩展点：路径生成器 / 网格生成器（Phase 4.3）
// ---------------------------------------------------------------------------
export {
  registerPathGenerator,
  getPathGenerator,
  generateEdgePath,
  buildPathGeneratorOptions,
  type EdgePathGenerator,
  type EdgePathGeneratorOptions
} from './utils/edge-path-generator';

export {
  registerGridGenerator,
  getGridGenerator,
  type GridPatternGenerator
} from './components/background/GridPatternGenerator';
