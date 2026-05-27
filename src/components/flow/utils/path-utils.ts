/**
 * Flow 路径定位工具
 *
 * 提供 SVG path 上的点查询能力，用于在路径中点放置标签、删除按钮等元素。
 *
 * 实际的路径字符串构造由 `edge-path-generator.ts` 负责（带视口/箭头/控制点逻辑）， 因此这里不再提供 generateStraightPath /
 * generateBezierPath / generateStepPath 等冗余的纯几何字符串拼接函数，避免与 edge-path-generator 形成两套真理。
 */

/** 获取 SVG 路径中点（用于删除按钮等元素定位） */
export function getPathMidpoint(
  pathData: string,
  fallback: { x: number; y: number }
): { x: number; y: number } {
  return getPathPointAt(pathData, 0.5, fallback);
}

/** 获取 SVG 路径上某比例位置的点（t: 0~1） */
export function getPathPointAt(
  pathData: string,
  t: number,
  fallback: { x: number; y: number }
): { x: number; y: number } {
  const ratio = Math.min(1, Math.max(0, t));

  if (typeof document !== 'undefined') {
    try {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      const total = path.getTotalLength();
      if (total > 0) {
        const point = path.getPointAtLength(total * ratio);
        return { x: point.x, y: point.y };
      }
    } catch {
      // happy-dom / SSR 等无 SVG getPointAtLength 实现时回退
    }
  }

  return fallback;
}
