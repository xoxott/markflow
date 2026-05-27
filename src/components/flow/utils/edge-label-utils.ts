/** 连接线标签样式解析（边数据 + 全局 config 合并） */

import type { FlowConfig } from '../types/flow-config';
import type { FlowEdge } from '../types/flow-edge';
import { DEFAULT_EDGE_CONFIG } from '../config/default-config';
import { EDGE_CSS_VARS } from '../constants/edge-constants';

export interface ResolvedEdgeLabelStyle {
  fontSize: number;
  fill: string;
  showBackground: boolean;
  backgroundFill: string;
  padding: number;
  borderRadius: number;
  textStyle: Record<string, unknown>;
  backgroundStyle: Record<string, unknown>;
}

const CJK_CHAR_PATTERN = /[\u4E00-\u9FFF\u3400-\u4DBF\uFF00-\uFFEF]/;

/** 估算文本宽度（SVG 无 DOM 测量时的近似值，中文按 1em 计） */
export function estimateEdgeLabelWidth(text: string, fontSize: number): number {
  let width = 0;
  for (const char of text) {
    width += CJK_CHAR_PATTERN.test(char) ? fontSize : fontSize * 0.58;
  }
  return Math.max(fontSize * 1.5, width);
}

/** 合并边级与全局 config，得到最终标签样式 */
export function resolveEdgeLabelStyle(
  edge: FlowEdge,
  config?: Readonly<FlowConfig>
): ResolvedEdgeLabelStyle {
  const edgeCfg = config?.edges;
  const fontSize = edgeCfg?.labelFontSize ?? DEFAULT_EDGE_CONFIG.labelFontSize ?? 12;
  const showBackground =
    edge.labelShowBackground ??
    edgeCfg?.labelShowBackground ??
    DEFAULT_EDGE_CONFIG.labelShowBackground ??
    true;
  const padding =
    edgeCfg?.labelBackgroundPadding ?? DEFAULT_EDGE_CONFIG.labelBackgroundPadding ?? 4;
  const borderRadius =
    edgeCfg?.labelBackgroundRadius ?? DEFAULT_EDGE_CONFIG.labelBackgroundRadius ?? 4;

  return {
    fontSize,
    fill: EDGE_CSS_VARS.LABEL,
    showBackground: showBackground !== false,
    backgroundFill: 'var(--flow-edge-label-bg, #ffffff)',
    padding,
    borderRadius,
    textStyle: edge.labelStyle ?? {},
    backgroundStyle: edge.labelBackgroundStyle ?? {}
  };
}
