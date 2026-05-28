/**
 * 默认历史记录管理器（框架无关）
 *
 * 实现 IHistoryManager 接口，管理状态历史记录 支持撤销/重做功能
 */

import type { IHistoryManager } from '../interfaces/IHistoryManager';
import type { IStateStore } from '../interfaces/IStateStore';
import type { FlowStateSnapshot } from '../types';

/** 默认历史记录管理器选项 */
export interface DefaultHistoryManagerOptions {
  /** 最大历史记录数量 */
  maxHistorySize?: number;
}

/**
 * 默认历史记录管理器实现
 *
 * 管理状态历史记录，支持撤销/重做
 */
export class DefaultHistoryManager implements IHistoryManager {
  /** 状态存储实例 */
  private store: IStateStore;
  /** 历史记录数组 */
  private history: FlowStateSnapshot[] = [];
  /** 历史记录指针 */
  private historyIndex: number = -1;
  /** 最大历史记录数量 */
  private maxHistorySize: number = 50;
  /** 历史变化订阅者 */
  private listeners: Set<() => void> = new Set();
  /** 正在从快照恢复（撤销/重做/restore 期间为 true，用于抑制自动 pushHistory） */
  private restoringDepth = 0;

  constructor(store: IStateStore, options?: DefaultHistoryManagerOptions) {
    this.store = store;
    this.maxHistorySize = options?.maxHistorySize || 50;

    // 保存初始状态
    this.pushHistory();
  }

  /** 通知所有订阅者：历史栈位置可能发生了变化 */
  private notifyChange(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        // 单个监听器异常不应影响其它监听器
        // eslint-disable-next-line no-console
        console.error('[FlowHistoryManager] listener error:', error);
      }
    });
  }

  /** 是否正在从快照恢复状态（自动历史记录应跳过） */
  isRestoring(): boolean {
    return this.restoringDepth > 0;
  }

  /** 订阅历史变化（push / undo / redo / clear / restore / reset 都会触发） */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** 保存当前状态到历史记录 */
  pushHistory(): void {
    const snapshot: FlowStateSnapshot = {
      nodes: this.store.getNodes().map(node => ({ ...node })),
      edges: this.store.getEdges().map(edge => ({ ...edge })),
      viewport: { ...this.store.getViewport() },
      selectedNodeIds: this.store.getSelectedNodeIds?.()
        ? [...this.store.getSelectedNodeIds()!]
        : [],
      selectedEdgeIds: this.store.getSelectedEdgeIds?.()
        ? [...this.store.getSelectedEdgeIds()!]
        : [],
      timestamp: Date.now()
    };

    // 删除当前指针之后的历史记录（如果有撤销操作）
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // 添加新的历史记录
    this.history.push(snapshot);

    // 限制历史记录数量
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      // 注意：shift 后不需要更新 historyIndex，因为指针指向的是数组中的位置
    } else {
      this.historyIndex += 1;
    }

    this.notifyChange();
  }

  /**
   * 撤销操作
   *
   * @returns 是否成功撤销
   */
  undo(): boolean {
    if (this.historyIndex <= 0) {
      return false;
    }

    this.historyIndex -= 1;
    this.restoreSnapshot(this.history[this.historyIndex]);
    this.notifyChange();
    return true;
  }

  /**
   * 重做操作
   *
   * @returns 是否成功重做
   */
  redo(): boolean {
    if (this.historyIndex >= this.history.length - 1) {
      return false;
    }

    this.historyIndex += 1;
    this.restoreSnapshot(this.history[this.historyIndex]);
    this.notifyChange();
    return true;
  }

  /**
   * 检查是否可以撤销
   *
   * @returns 是否可以撤销
   */
  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  /**
   * 检查是否可以重做
   *
   * @returns 是否可以重做
   */
  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  /** 清空历史记录 */
  clearHistory(): void {
    this.history = [];
    this.historyIndex = -1;
    // 保存当前状态作为新的初始状态（pushHistory 会触发 notifyChange）
    this.pushHistory();
  }

  /**
   * 获取历史记录数量
   *
   * @returns 历史记录数量
   */
  getHistorySize(): number {
    return this.history.length;
  }

  /**
   * 创建当前状态快照
   *
   * @returns 状态快照
   */
  createSnapshot(): FlowStateSnapshot {
    return {
      nodes: this.store.getNodes().map(node => ({ ...node })),
      edges: this.store.getEdges().map(edge => ({ ...edge })),
      viewport: { ...this.store.getViewport() },
      selectedNodeIds: this.store.getSelectedNodeIds?.()
        ? [...this.store.getSelectedNodeIds()!]
        : [],
      selectedEdgeIds: this.store.getSelectedEdgeIds?.()
        ? [...this.store.getSelectedEdgeIds()!]
        : [],
      timestamp: Date.now()
    };
  }

  /**
   * 从快照恢复状态
   *
   * @param snapshot 状态快照
   */
  restoreSnapshot(snapshot: FlowStateSnapshot): void {
    this.restoringDepth += 1;
    try {
      // 恢复节点
      this.store.setNodes(snapshot.nodes);

      // 恢复连接线
      this.store.setEdges(snapshot.edges);

      // 恢复视口
      this.store.setViewport(snapshot.viewport);

      // 恢复选择状态（如果支持）
      if (this.store.setSelectedNodeIds && this.store.setSelectedEdgeIds) {
        this.store.setSelectedNodeIds(snapshot.selectedNodeIds);
        this.store.setSelectedEdgeIds(snapshot.selectedEdgeIds);
      }
    } finally {
      this.restoringDepth -= 1;
    }
  }

  /** 重置到初始状态 */
  reset(): void {
    this.store.setNodes([]);
    this.store.setEdges([]);
    this.store.setViewport({ x: 0, y: 0, zoom: 1 });

    if (this.store.setSelectedNodeIds && this.store.setSelectedEdgeIds) {
      this.store.setSelectedNodeIds([]);
      this.store.setSelectedEdgeIds([]);
    }

    this.clearHistory();
  }
}
