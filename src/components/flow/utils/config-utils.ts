/**
 * Flow 配置工具函数
 *
 * 提供配置相关的工具函数：合并、验证、规范化、克隆等
 */

import type { Component } from 'vue';
import { markRaw } from 'vue';
import type { FlowCanvasConfig, FlowConfig, PartialFlowConfig } from '../types/flow-config';
import type { FlowEdgeType } from '../types/flow-edge';
import type { FlowNodeType } from '../types/flow-node';
import { DEFAULT_FLOW_CONFIG } from '../config/default-config';

function isVueComponent(value: unknown): value is Component {
  return (
    typeof value === 'function' || (typeof value === 'object' && value !== null && 'setup' in value)
  );
}

/** 避免 nodeTypes / edgeTypes 中的 Component 被 reactive 深度代理 */
function markRegistryComponentsRaw<T extends FlowNodeType | FlowEdgeType | Component>(
  registry?: Record<string, T>
): Record<string, T> | undefined {
  if (!registry) {
    return registry;
  }

  const next: Record<string, T> = {};
  for (const [key, entry] of Object.entries(registry)) {
    if (entry && typeof entry === 'object' && 'component' in entry && entry.component) {
      next[key] = {
        ...entry,
        component: markRaw(entry.component as Component)
      } as T;
      continue;
    }
    if (isVueComponent(entry)) {
      next[key] = markRaw(entry) as T;
      continue;
    }
    next[key] = entry;
  }
  return next;
}

function applyNonCloneableRegistryFields(config: FlowConfig): FlowConfig {
  const next = { ...config };
  if (next.nodes?.nodeTypes) {
    next.nodes = {
      ...next.nodes,
      nodeTypes: markRegistryComponentsRaw(next.nodes.nodeTypes)
    };
  }
  if (next.edges?.edgeTypes) {
    next.edges = {
      ...next.edges,
      edgeTypes: markRegistryComponentsRaw(next.edges.edgeTypes)
    };
  }
  return next;
}

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
    return applyNonCloneableRegistryFields({ ...target });
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
        const mergeBase =
          targetValue &&
          typeof targetValue === 'object' &&
          !Array.isArray(targetValue) &&
          !(targetValue instanceof Date) &&
          !(targetValue instanceof RegExp)
            ? targetValue
            : {};
        // 深度合并对象
        result[key as keyof FlowConfig] = {
          ...mergeBase,
          ...sourceValue
        } as never;
      } else if (sourceValue !== undefined) {
        // 直接赋值
        result[key as keyof FlowConfig] = sourceValue as any;
      }
    }
  }

  return applyNonCloneableRegistryFields(result);
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
 * 优先使用 `structuredClone`（保留 Date / RegExp / 嵌套结构）； 如配置中包含函数（如 `isValidConnection`）、Vue
 * Component（`nodeTypes` / `edgeTypes`）或路径生成器等不可结构化克隆的值， 克隆前临时剥离这些字段，克隆后再按原引用写回。
 *
 * 注意：旧实现用 `JSON.parse(JSON.stringify(config))` 会静默丢失 `nodeTypes.component` 等注册表组件，导致自定义节点回退为
 * BaseNode。
 *
 * @param config 要克隆的配置
 * @returns 克隆后的配置
 */
export function cloneConfig(config: FlowConfig): FlowConfig {
  const preserved = {
    isValidConnection: config.isValidConnection,
    nodeTypes: config.nodes?.nodeTypes,
    edgeTypes: config.edges?.edgeTypes,
    edgePathGenerators: config.edges?.edgePathGenerators
  };

  const stripped: FlowConfig = { ...config };
  if (typeof preserved.isValidConnection === 'function') {
    delete stripped.isValidConnection;
  }
  if (stripped.nodes?.nodeTypes) {
    stripped.nodes = { ...stripped.nodes, nodeTypes: {} };
  }
  if (stripped.edges) {
    stripped.edges = {
      ...stripped.edges,
      ...(stripped.edges.edgeTypes ? { edgeTypes: {} } : {}),
      ...(stripped.edges.edgePathGenerators ? { edgePathGenerators: {} } : {})
    };
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

  if (preserved.nodeTypes) {
    cloned.nodes = { ...cloned.nodes, nodeTypes: preserved.nodeTypes };
  }
  if (preserved.edgeTypes || preserved.edgePathGenerators) {
    cloned.edges = {
      ...cloned.edges,
      ...(preserved.edgeTypes ? { edgeTypes: preserved.edgeTypes } : {}),
      ...(preserved.edgePathGenerators ? { edgePathGenerators: preserved.edgePathGenerators } : {})
    };
  }
  if (typeof preserved.isValidConnection === 'function') {
    cloned.isValidConnection = preserved.isValidConnection;
  }

  return cloned;
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

/** 拖拽吸附 / 对齐参考线是否开启（工具栏开关读取） */
export function isDragSnapGuidesEnabled(canvas?: FlowCanvasConfig): boolean {
  if (!canvas) {
    return false;
  }
  return Boolean(canvas.snapToGrid || canvas.snapToGuides || canvas.snapToAlignment);
}

/** 工具栏切换拖拽对齐参考线时的 canvas 补丁 */
export function dragSnapGuidesCanvasPatch(
  enabled: boolean
): Pick<FlowCanvasConfig, 'snapToGrid' | 'showSnapGuides' | 'snapToGuides' | 'snapToAlignment'> {
  return {
    snapToGrid: enabled,
    showSnapGuides: enabled,
    snapToGuides: enabled,
    snapToAlignment: enabled
  };
}
