/**
 * Ref 工具函数
 *
 * 提供 Ref 更新相关的工具函数
 */

import { type Ref, isRef, unref } from 'vue';

/**
 * 安全更新 Ref（只在值变化时更新）
 *
 * 使用引用比较，避免不必要的响应式更新
 */
export function safeUpdateRef<T>(ref: Ref<T>, newValue: T): void {
  if (ref.value !== newValue) {
    ref.value = newValue;
  }
}

/** 浅层比较更新 Ref（用于对象） */
export function shallowUpdateRef<T extends Record<string, any>>(
  ref: Ref<T>,
  newValue: T,
  keys: (keyof T)[]
): void {
  const oldValue = ref.value;
  if (oldValue === null || oldValue === undefined || newValue === null || newValue === undefined) {
    if (oldValue !== newValue) {
      ref.value = newValue;
    }
    return;
  }
  const hasChanged = keys.some(key => oldValue[key] !== newValue[key]);
  if (hasChanged) {
    ref.value = newValue;
  }
}

/** 从 expose / ref / 普通值中安全读取（兼容 Vue 对 expose Ref 的自动解包） */
export function readExposedRef<T>(source: Ref<T> | T | undefined | null, fallback: T): T {
  if (source === null || source === undefined) return fallback;
  if (isRef(source)) return source.value;
  return source as T;
}

/** 读取可能为 Ref 的布尔 expose 值 */
export function readExposedBool(
  source: Ref<boolean> | boolean | undefined | null,
  fallback = false
): boolean {
  return readExposedRef(source, fallback);
}

/** 读取 FlowCanvas expose 上的 viewport */
export function readExposedViewport(
  source:
    | Ref<{ x: number; y: number; zoom: number }>
    | { x: number; y: number; zoom: number }
    | undefined
    | null
): { x: number; y: number; zoom: number } | null {
  if (source === null || source === undefined) return null;
  const vp = unref(source);
  if (vp && typeof vp.zoom === 'number') return vp;
  return null;
}
