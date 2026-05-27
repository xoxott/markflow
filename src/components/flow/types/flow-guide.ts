/** 用户拖拽创建的辅助线 */

export type FlowGuideAxis = 'horizontal' | 'vertical';

export interface FlowGuideLine {
  id: string;
  axis: FlowGuideAxis;
  /** horizontal → 画布 Y；vertical → 画布 X */
  position: number;
}

/** 正在创建 / 移动辅助线的草稿 */
export interface FlowGuideDraft {
  mode: 'create' | 'move';
  axis: FlowGuideAxis;
  position: number;
  guideId?: string;
}
