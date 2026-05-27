/** 从画布根元素读取连接线主题色（Canvas 绘制用） */

import { EDGE_COLORS } from '../constants/edge-constants';
import { CSS_VARIABLES } from '../constants/theme-constants';
import { getCssVariable } from './theme-utils';

export interface ResolvedEdgeColors {
  default: string;
  selected: string;
  hovered: string;
}

/** 解析连接线颜色；优先从 .flow-canvas 上的 --flow-edge-* 读取 */
export function resolveEdgeColors(themeRoot?: HTMLElement | null): ResolvedEdgeColors {
  const el =
    themeRoot ??
    (typeof document !== 'undefined'
      ? (document.querySelector('.flow-canvas') as HTMLElement | null)
      : null) ??
    (typeof document !== 'undefined' ? document.documentElement : undefined);

  if (!el) {
    return {
      default: EDGE_COLORS.DEFAULT,
      selected: EDGE_COLORS.SELECTED,
      hovered: EDGE_COLORS.HOVERED
    };
  }

  return {
    default: getCssVariable(CSS_VARIABLES.EDGE_DEFAULT, el, EDGE_COLORS.DEFAULT),
    selected: getCssVariable(CSS_VARIABLES.EDGE_SELECTED, el, EDGE_COLORS.SELECTED),
    hovered: getCssVariable(CSS_VARIABLES.EDGE_SELECTED, el, EDGE_COLORS.SELECTED)
  };
}
