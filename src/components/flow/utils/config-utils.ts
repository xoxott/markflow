/**
 * Flow 配置工具函数
 *
 * 提供配置相关的工具函数：合并、验证、规范化、克隆等
 */

import type { FlowConfig, PartialFlowConfig } from '../types/flow-config';
import { DEFAULT_FLOW_CONFIG } from '../config/default-config';

/**
 * 深度合并配置
 *
 * 将源配置深度合并到目标配置中
 *
 * @param target 目标配置
 * @param source 源配置
 * @returns 合并后的配置
 */
export function mergeConfig(target: FlowConfig, source?: PartialFlowConfig): FlowConfig {
  if (!source) {
    return { ...target };
  }

  const result: FlowConfig = { ...target };

  for (const key in source) {
    if (Object.hasOwn(source, key)) {
      const sourceValue = source[key as keyof FlowConfig];
      const targetValue = target[key as keyof FlowConfig];

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        !(sourceValue instanceof Date) &&
        !(sourceValue instanceof RegExp)
      ) {
        // 深度合并对象
        result[key as keyof FlowConfig] = {
          ...targetValue,
          ...sourceValue
        } as any;
      } else if (sourceValue !== undefined) {
        // 直接赋值
        result[key as keyof FlowConfig] = sourceValue as any;
      }
    }
  }

  return result;
}

/**
 * 规范化配置
 *
 * 将部分配置填充默认值，生成完整配置
 *
 * @param partialConfig 部分配置
 * @returns 完整配置
 */
export function normalizeConfig(partialConfig?: PartialFlowConfig): FlowConfig {
  return mergeConfig(DEFAULT_FLOW_CONFIG, partialConfig);
}

/**
 * 深度克隆配置
 *
 * 优先使用 `structuredClone`（保留 Date / RegExp / 嵌套结构）； 如配置中包含函数（如 `isValidConnection`）或 Vue Component
 * 等不可结构化克隆的值， 自动回退到带特殊字段保留的浅克隆：函数与 Component 字段直接共享引用即可。
 *
 * 注意：旧实现用 `JSON.parse(JSON.stringify(config))` 会静默吃掉 `isValidConnection` 等函数字段，造成配置回滚后用户回调消失。
 *
 * @param config 要克隆的配置
 * @returns 克隆后的配置
 */
export function cloneConfig(config: FlowConfig): FlowConfig {
  // 抓出无法结构化克隆的引用字段（函数、Vue Component 等）单独保留
  const fnFields: Partial<FlowConfig> = {};
  if (typeof config.isValidConnection === 'function') {
    fnFields.isValidConnection = config.isValidConnection;
  }

  const stripped: FlowConfig = { ...config };
  if (fnFields.isValidConnection) {
    delete stripped.isValidConnection;
  }

  let cloned: FlowConfig;
  if (typeof structuredClone === 'function') {
    try {
      cloned = structuredClone(stripped);
    } catch {
      cloned = JSON.parse(JSON.stringify(stripped));
    }
  } else {
    cloned = JSON.parse(JSON.stringify(stripped));
  }

  return { ...cloned, ...fnFields };
}

/**
 * 获取配置值（支持路径访问）
 *
 * 例如：getConfigValue(config, 'canvas.minZoom')
 *
 * @param config 配置对象
 * @param path 配置路径（用点分隔）
 * @returns 配置值
 */
export function getConfigValue(config: FlowConfig, path: string): any {
  const keys = path.split('.');
  let value: any = config;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key as keyof typeof value];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * 设置配置值（支持路径访问）
 *
 * 例如：setConfigValue(config, 'canvas.minZoom', 0.2)
 *
 * @param config 配置对象
 * @param path 配置路径（用点分隔）
 * @param value 要设置的值
 */
export function setConfigValue(config: FlowConfig, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let target: any = config;

  for (const key of keys) {
    if (!target[key]) {
      target[key] = {};
    }
    target = target[key];
  }

  target[lastKey] = value;
}
