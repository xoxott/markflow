/**
 * Flow 样式 public 入口（显式 side-effect import）
 *
 * 宿主端在应用入口（main.ts/App.tsx）执行一次：
 *
 * ```ts
 * import '@/components/flow/styles';
 * ```
 *
 * 这样将 FlowCanvas 等组件解耦，避免组件内部隐式加载样式。
 */

import './styles/index.scss';
