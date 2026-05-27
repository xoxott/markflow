/**
 * Flow 配置验证器
 *
 * 走 Zod schema 做结构验证，保证只有一套校验真理（`types/schemas.ts`）。 不再重复实现节点 / 边的字段级 if/else 校验。
 */

import { FlowConfigSchema } from '../types/schemas';
import { validateConnection as validateConnectionImpl } from '../utils/validation-utils';
import type { FlowConfig } from '../types/flow-config';

/** 配置验证结果 */
export interface ConfigValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息列表（`<path>: <message>`） */
  errors: string[];
  /** 警告信息列表（保留字段，当前未启用） */
  warnings: string[];
}

/** Flow 配置验证器类 */
export class FlowConfigValidator {
  /** 验证完整配置 */
  validate(config: FlowConfig): ConfigValidationResult {
    const result = FlowConfigSchema.safeParse(config);
    if (result.success) {
      return { valid: true, errors: [], warnings: [] };
    }
    const errors = result.error.issues.map(issue => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '<root>';
      return `${path}: ${issue.message}`;
    });
    return { valid: false, errors, warnings: [] };
  }

  /** 验证配置并在失败时抛错 */
  validateOrThrow(config: FlowConfig): void {
    const result = this.validate(config);
    if (!result.valid) {
      throw new Error(`Invalid Flow config: ${result.errors.join('; ')}`);
    }
  }

  /** 验证连接（异步，复用 isValidConnection 回调） */
  async validateConnection(
    connection: Partial<import('../types/flow-edge').FlowEdge>,
    config: FlowConfig
  ): Promise<{ valid: boolean; reason?: string }> {
    return validateConnectionImpl(connection, config);
  }

  /** 仅验证某一节区（canvas / nodes / edges / ...） */
  validateSection(config: FlowConfig, section: keyof FlowConfig): ConfigValidationResult {
    const partial = { [section]: config[section] } as FlowConfig;
    return this.validate(partial);
  }
}

/** 创建验证器实例 */
export function createFlowConfigValidator(): FlowConfigValidator {
  return new FlowConfigValidator();
}
