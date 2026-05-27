/**
 * Flow 连接校验工具
 *
 * 真正的结构校验（节点 / 边 / 配置）请使用 `types/schemas.ts` 中导出的 Zod schema：
 *
 * - `zodValidateNode` / `zodSafeValidateNode`
 * - `zodValidateEdge` / `zodSafeValidateEdge`
 * - `zodValidateConfig` / `zodSafeValidateConfig`
 *
 * 这里只保留 `validateConnection`：连接创建时需要异步调用宿主提供的 `isValidConnection`，所以不适合放进静态 Zod schema。
 */

import type { FlowConfig } from '../types/flow-config';
import type { FlowEdge } from '../types/flow-edge';

/**
 * 验证连接是否有效
 *
 * @param connection 连接数据
 * @param config 配置（包含验证函数）
 * @returns 是否有效以及失败原因
 */
export async function validateConnection(
  connection: Partial<FlowEdge>,
  config: FlowConfig
): Promise<{ valid: boolean; reason?: string }> {
  if (!connection.source || !connection.target) {
    return { valid: false, reason: 'Source and target are required' };
  }

  if (connection.source === connection.target) {
    return { valid: false, reason: 'Cannot connect node to itself' };
  }

  if (config.isValidConnection) {
    try {
      const result = await config.isValidConnection(connection);
      if (typeof result === 'string') {
        return { valid: false, reason: result };
      }
      if (result === false) {
        return { valid: false, reason: 'Connection validation failed' };
      }
    } catch (error) {
      return {
        valid: false,
        reason: error instanceof Error ? error.message : 'Validation error'
      };
    }
  }

  return { valid: true };
}
