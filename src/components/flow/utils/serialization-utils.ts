/**
 * Flow 序列化工具（Phase 5.3）
 *
 * 提供 FlowSnapshot 的 toJSON / fromJSON 能力，附带 schema 版本字段 便于跨版本迁移（migrate）。
 *
 * 业务通常通过 FlowCanvas.exportJSON() / importJSON() 调用，无需直接接触。
 */

import type { FlowEdge, FlowNode, FlowViewport } from '../types';
import type { FlowGuideLine } from '../types/flow-guide';
import { logger } from './logger';

/** 当前 snapshot 版本 */
export const FLOW_SNAPSHOT_VERSION = 1 as const;

/** 序列化的 Flow 状态快照 */
export interface FlowSnapshot {
  /** schema 版本号，便于跨版本迁移 */
  version: number;
  /** 节点列表 */
  nodes: FlowNode[];
  /** 连接线列表 */
  edges: FlowEdge[];
  /** 视口 */
  viewport: FlowViewport;
  /** 辅助线（可选） */
  guides?: FlowGuideLine[];
  /** 附加元数据 */
  meta?: Record<string, unknown>;
}

export interface ToJSONOptions {
  /** 是否包含视口 */
  includeViewport?: boolean;
  /** 是否包含辅助线 */
  includeGuides?: boolean;
  /** 额外元数据 */
  meta?: Record<string, unknown>;
}

/** 将 Flow 状态序列化为 JSON 友好对象 */
export function toJSON(
  input: {
    nodes: FlowNode[];
    edges: FlowEdge[];
    viewport: FlowViewport;
    guides?: FlowGuideLine[];
  },
  options: ToJSONOptions = {}
): FlowSnapshot {
  const { includeViewport = true, includeGuides = true, meta } = options;
  const snapshot: FlowSnapshot = {
    version: FLOW_SNAPSHOT_VERSION,
    nodes: input.nodes.map(cloneNode),
    edges: input.edges.map(cloneEdge),
    viewport: includeViewport ? { ...input.viewport } : { x: 0, y: 0, zoom: 1 }
  };
  if (includeGuides && input.guides) {
    snapshot.guides = input.guides.map(g => ({ ...g }));
  }
  if (meta) {
    snapshot.meta = { ...meta };
  }
  return snapshot;
}

/**
 * 从 JSON 反序列化为 Flow 状态
 *
 * - 若 version 不匹配，会尝试运行注册的 migration（未来扩展）
 * - 缺失视口时回退到默认值
 */
export function fromJSON(input: unknown): FlowSnapshot {
  if (!input || typeof input !== 'object') {
    throw new TypeError('[fromJSON] 输入不是合法 JSON 对象');
  }
  const raw = input as Partial<FlowSnapshot> & { version?: number };
  const version = typeof raw.version === 'number' ? raw.version : 0;

  const migrated = migrateSnapshot(raw, version);

  if (!Array.isArray(migrated.nodes) || !Array.isArray(migrated.edges)) {
    throw new TypeError('[fromJSON] 缺少 nodes / edges 数组');
  }

  return {
    version: FLOW_SNAPSHOT_VERSION,
    nodes: migrated.nodes.map(cloneNode),
    edges: migrated.edges.map(cloneEdge),
    viewport: migrated.viewport ?? { x: 0, y: 0, zoom: 1 },
    guides: migrated.guides?.map(g => ({ ...g })),
    meta: migrated.meta ? { ...migrated.meta } : undefined
  };
}

/**
 * 跨版本迁移钩子（当前版本 1，预留扩展点）
 *
 * @param raw 原始 snapshot 对象
 * @param fromVersion 输入 schema 版本
 */
function migrateSnapshot(raw: Partial<FlowSnapshot>, fromVersion: number): Partial<FlowSnapshot> {
  let current = raw;
  // 后续版本升级时在这里添加 case
  if (fromVersion < 1) {
    logger.warn(`[fromJSON] snapshot version=${fromVersion} 低于当前 1，按 1 解析`);
    // 假设 v0 没有 viewport 字段
    if (!current.viewport) {
      current = { ...current, viewport: { x: 0, y: 0, zoom: 1 } };
    }
  }
  if (fromVersion > FLOW_SNAPSHOT_VERSION) {
    logger.warn(
      `[fromJSON] snapshot version=${fromVersion} 高于当前 ${FLOW_SNAPSHOT_VERSION}，可能存在未识别字段`
    );
  }
  return current;
}

function cloneNode(node: FlowNode): FlowNode {
  return {
    ...node,
    position: { ...node.position },
    size: node.size ? { ...node.size } : undefined,
    data: structuredCloneSafe(node.data),
    style: node.style ? { ...node.style } : undefined,
    handles: node.handles ? node.handles.map(h => ({ ...h })) : undefined
  };
}

function cloneEdge(edge: FlowEdge): FlowEdge {
  return {
    ...edge,
    data: edge.data ? structuredCloneSafe(edge.data) : undefined,
    style: edge.style ? { ...edge.style } : undefined,
    labelStyle: edge.labelStyle ? { ...edge.labelStyle } : undefined,
    labelBackgroundStyle: edge.labelBackgroundStyle ? { ...edge.labelBackgroundStyle } : undefined
  };
}

function structuredCloneSafe<T>(value: T): T {
  if (value === undefined || value === null) return value;
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // fall through
    }
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}
