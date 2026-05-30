import type { UiOptionItem } from './types';

/** 带名称的目标实体（detail 可选返回；缺省时用 ID 占位） */
export interface AdminOptionTarget {
  id: number;
  name: string;
}

/** 从已选 ID 与可选名称构建回显 option；无 name 时 label 为 ID 字符串 */
export function buildPresetOptionsFromTargets(
  ids: number[] | null | undefined,
  targets?: AdminOptionTarget[] | null
): UiOptionItem[] {
  if (!ids?.length) {
    return [];
  }

  const nameById = new Map((targets ?? []).map(target => [target.id, target.name]));

  return ids.map(id => ({
    value: id,
    label: nameById.get(id) ?? String(id)
  }));
}

/** 合并 preset（回显占位）与远程结果；同 value 时远程 label 优先 */
export function mergeAdminOptionItems(
  remoteItems: UiOptionItem[],
  presetItems: UiOptionItem[] = []
): UiOptionItem[] {
  const map = new Map<string, UiOptionItem>();

  for (const item of [...presetItems, ...remoteItems]) {
    map.set(String(item.value), item);
  }

  return Array.from(map.values());
}

/** 从已选 bind 值生成占位 option（编辑回显，label 暂用 value 字符串） */
export function buildPresetOptionsFromValues(
  values: Array<string | number> | string | number | null | undefined
): UiOptionItem[] {
  if (values === null || values === undefined || values === '') {
    return [];
  }

  const list = Array.isArray(values) ? values : [values];

  return list.map(value => ({
    value,
    label: String(value)
  }));
}

export function hasAdminSelectBoundValue(
  value: Array<string | number> | string | number | null | undefined
): boolean {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
}
