/**
 * Flow 内部 API 入口（advanced consumers / plugin authors）
 *
 * 注意：
 *
 * - 这里的 API _不_ 保证向后兼容，可能在小版本之间调整签名
 * - 仅在需要扩展 Flow 内部行为（自定义状态管理、插入低层 Hook、性能调优、 自定义渲染管线）时使用
 * - 业务代码请优先使用 `from '@/components/flow'`（public API）
 */

// 内部组件（高级渲染、布局）
export { default as FlowNodes } from './components/FlowNodes';
export { default as FlowEdges } from './components/FlowEdges';
export { default as FlowBackground } from './components/FlowBackground';
export { default as FlowViewportContainer } from './components/FlowViewportContainer';
export { default as FlowRuler } from './components/FlowRuler';
export { default as FlowGuideLines } from './components/FlowGuideLines';
export { default as FlowSnapGuides } from './components/FlowSnapGuides';

// 底层 hooks
export * from './hooks';

// 状态管理
export * from './core/state';

// 事件
export * from './core/events';

// 交互
export * from './core/interaction';

// 性能
export * from './core/performance';

// 工具
export * from './utils';

// 插件系统
export { FlowPluginLoader } from './core/plugin/FlowPluginLoader';
export { FlowPluginContextImpl } from './core/plugin/FlowPluginContext';

// 小地图工具
export * from './minimap';
