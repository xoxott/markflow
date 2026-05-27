/**
 * FlowCanvas 核心逻辑 Hook
 *
 * 向后兼容入口：委托给 orchestrator 层
 */

export type { FlowCanvasEmit, FlowCanvasEmitMap } from '../types/flow-events';
export {
  useFlowCanvasOrchestrator as useFlowCanvasCore,
  type UseFlowCanvasCoreOptions,
  type UseFlowCanvasCoreReturn
} from './orchestrator/useFlowCanvasOrchestrator';
