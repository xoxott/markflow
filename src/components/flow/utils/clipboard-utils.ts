/**
 * Flow 剪贴板工具（Phase 5.3）
 *
 * 用于在 Flow 内部以及（可选）系统剪贴板之间复制 / 剪切 / 粘贴节点与连接线。
 *
 * 系统剪贴板（navigator.clipboard）失败时自动回退到 in-memory 剪贴板。
 */

import type { FlowEdge, FlowNode } from '../types';
import { logger } from './logger';

/** Flow 剪贴板载荷 */
export interface FlowClipboardPayload {
  /** 标识，避免误识别其它来源的 JSON */
  __flowClipboard: true;
  /** schema 版本 */
  version: number;
  /** 复制的节点（深拷贝） */
  nodes: FlowNode[];
  /** 复制的连接线（深拷贝） */
  edges: FlowEdge[];
}

export const CLIPBOARD_VERSION = 1;
const CLIPBOARD_MIME = 'application/x-flow-clipboard+json';

/** 进程内 fallback 剪贴板，避免系统剪贴板权限受限时无法粘贴 */
let memoryClipboard: FlowClipboardPayload | null = null;

/**
 * 序列化选区为剪贴板载荷
 *
 * - 自动过滤未在选区内、但目标/源节点已被复制的连接线
 */
export function buildClipboardPayload(input: {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeIds: ReadonlyArray<string> | ReadonlySet<string>;
  selectedEdgeIds?: ReadonlyArray<string> | ReadonlySet<string>;
}): FlowClipboardPayload | null {
  const nodeIdSet =
    input.selectedNodeIds instanceof Set
      ? input.selectedNodeIds
      : new Set(input.selectedNodeIds as ReadonlyArray<string>);
  const edgeIdSet =
    input.selectedEdgeIds instanceof Set
      ? input.selectedEdgeIds
      : new Set((input.selectedEdgeIds ?? []) as ReadonlyArray<string>);

  const nodes = input.nodes.filter(n => nodeIdSet.has(n.id)).map(deepCloneNode);
  if (nodes.length === 0) {
    return null;
  }

  const nodeIds = new Set(nodes.map(n => n.id));
  const edges = input.edges
    .filter(e => {
      if (edgeIdSet.has(e.id)) {
        // 显式选中的边：要求两端都在节点选区内才复制（避免悬空边）
        return nodeIds.has(e.source) && nodeIds.has(e.target);
      }
      // 未显式选中：自动复制两端均在节点选区内的边
      return nodeIds.has(e.source) && nodeIds.has(e.target);
    })
    .map(deepCloneEdge);

  return {
    __flowClipboard: true,
    version: CLIPBOARD_VERSION,
    nodes,
    edges
  };
}

/** 解析剪贴板字符串为 Flow 载荷 */
export function parseClipboardPayload(text: string): FlowClipboardPayload | null {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.__flowClipboard === true &&
      Array.isArray(parsed.nodes) &&
      Array.isArray(parsed.edges)
    ) {
      return parsed as FlowClipboardPayload;
    }
  } catch {
    /* not JSON */
  }
  return null;
}

/** 写入剪贴板：优先系统剪贴板，失败回退到进程内剪贴板 */
export async function writeClipboard(payload: FlowClipboardPayload | null): Promise<boolean> {
  if (!payload) return false;
  memoryClipboard = payload;
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload));
      return true;
    } catch (err) {
      logger.warn('[clipboard] 写入系统剪贴板失败，已使用 in-memory 剪贴板', err);
    }
  }
  return true;
}

/** 读取剪贴板：优先尝试系统剪贴板，失败或非 Flow 载荷时回退到 in-memory */
export async function readClipboard(): Promise<FlowClipboardPayload | null> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = parseClipboardPayload(text);
      if (parsed) return parsed;
    } catch (err) {
      logger.warn('[clipboard] 读取系统剪贴板失败，尝试 in-memory 剪贴板', err);
    }
  }
  return memoryClipboard;
}

export function getMemoryClipboard(): FlowClipboardPayload | null {
  return memoryClipboard;
}

export function setMemoryClipboard(payload: FlowClipboardPayload | null): void {
  memoryClipboard = payload;
}

export interface ApplyClipboardOptions {
  /** 粘贴位移（flow 坐标），默认 { x: 24, y: 24 } */
  offset?: { x: number; y: number };
  /** ID 前缀（用于去重） */
  idPrefix?: string;
  /** 自定义 ID 生成器 */
  generateId?: () => string;
}

export interface ApplyClipboardResult {
  /** 新创建的节点（已重写 ID 与位移） */
  nodes: FlowNode[];
  /** 新创建的连接线（已重写 ID 与重定向 source/target） */
  edges: FlowEdge[];
  /** 旧 ID -> 新 ID 映射，便于宿主进行后续处理 */
  idMap: Record<string, string>;
}

/**
 * 将剪贴板载荷转换为可插入画布的节点 / 连接线
 *
 * - 自动重写所有 ID、保持引用关系（edge.source/target → 新节点 id）
 * - 对节点位置施加 offset
 * - 不会修改输入对象
 */
export function applyClipboardPayload(
  payload: FlowClipboardPayload,
  options: ApplyClipboardOptions = {}
): ApplyClipboardResult {
  const offset = options.offset ?? { x: 24, y: 24 };
  const idPrefix = options.idPrefix ?? 'paste';
  let counter = 0;
  const generateId =
    options.generateId ?? (() => `${idPrefix}-${Date.now().toString(36)}-${++counter}`);

  const idMap: Record<string, string> = {};

  const nodes = payload.nodes.map(node => {
    const newId = generateId();
    idMap[node.id] = newId;
    return {
      ...deepCloneNode(node),
      id: newId,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y
      },
      selected: true
    };
  });

  const edges = payload.edges
    .map(edge => {
      const source = idMap[edge.source];
      const target = idMap[edge.target];
      if (!source || !target) return null;
      return {
        ...deepCloneEdge(edge),
        id: generateId(),
        source,
        target,
        selected: false
      };
    })
    .filter((e): e is FlowEdge => e !== null);

  return { nodes, edges, idMap };
}

function deepCloneNode(node: FlowNode): FlowNode {
  return {
    ...node,
    position: { ...node.position },
    size: node.size ? { ...node.size } : undefined,
    data: structuredCloneSafe(node.data),
    style: node.style ? { ...node.style } : undefined,
    handles: node.handles ? node.handles.map(h => ({ ...h })) : undefined
  };
}

function deepCloneEdge(edge: FlowEdge): FlowEdge {
  return {
    ...edge,
    data: edge.data ? structuredCloneSafe(edge.data) : undefined,
    style: edge.style ? { ...edge.style } : undefined
  };
}

function structuredCloneSafe<T>(value: T): T {
  if (value === undefined || value === null) return value;
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      /* fallback */
    }
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

export { CLIPBOARD_MIME };
