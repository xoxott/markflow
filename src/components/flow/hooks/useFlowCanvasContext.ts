/** FlowCanvas 注入上下文 Hook */

import { inject } from 'vue';
import { type FlowCanvasContextValue, flowCanvasContextKey } from '../context/flow-canvas-context';

/** 获取 FlowCanvas 上下文（必须在 FlowCanvas 子树内） */
export function useFlowCanvasContext(): FlowCanvasContextValue {
  const ctx = inject(flowCanvasContextKey, null);
  if (!ctx) {
    if (import.meta.env.DEV) {
      console.warn('[Flow] useFlowCanvasContext() 必须在 <FlowCanvas> 子组件或插槽内调用。');
    }
    throw new Error('FlowCanvas context is not available');
  }
  return ctx;
}

/** 可选获取 FlowCanvas 上下文（FlowCanvas 外返回 null） */
export function useFlowCanvasContextOptional(): FlowCanvasContextValue | null {
  return inject(flowCanvasContextKey, null);
}
