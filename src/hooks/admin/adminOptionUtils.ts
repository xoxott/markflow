import type { UiOptionItem } from './types';

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
