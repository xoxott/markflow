import type { UiOptionItem } from './types';

/** 带名称的目标实体（detail 可选返回；缺省时用 ID 占位） */
export interface AdminOptionTarget {
  id: number;
  name: string;
}

/** 从服务端 detail 已知实体构建静态回显 option（不随当前选中值变化） */
export function mapTargetsToPresetOptions(targets?: AdminOptionTarget[] | null): UiOptionItem[] {
  return (targets ?? []).map(target => ({
    value: target.id,
    label: target.name
  }));
}

/** 有 targets 时返回 preset；无则 undefined，不传 prop 时 hook 可监听 presetValues */
export function mapTargetsToPresetOptionsIfAny(
  targets?: AdminOptionTarget[] | null
): UiOptionItem[] | undefined {
  if (!targets?.length) {
    return undefined;
  }
  return mapTargetsToPresetOptions(targets);
}

/**
 * 从已选 ID 与可选名称构建回显 option；无 name 时 label 为 ID 字符串。 仅当 ids 与 targets 可能不一致时使用；编辑弹窗静态回显请用
 * mapTargetsToPresetOptions。
 */
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

/** 合并两组 option；同 value 时以后写入的一组为准（overrideItems 覆盖 baseItems） */
export function mergeAdminOptionItems(
  baseItems: UiOptionItem[],
  overrideItems: UiOptionItem[] = []
): UiOptionItem[] {
  const map = new Map<string, UiOptionItem>();

  for (const item of [...baseItems, ...overrideItems]) {
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

type AdminSelectValue = string | number | Array<string | number> | null;

/** 将 NSelect emit 的值对齐到 options 中的类型，避免 number/string 不一致导致 tag 显示原始值 */
export function coerceAdminSelectValue(
  value: AdminSelectValue,
  options: UiOptionItem[]
): AdminSelectValue {
  if (value === null) {
    return null;
  }

  const coerceOne = (item: string | number) => {
    const matched = options.find(option => String(option.value) === String(item));
    return matched ? matched.value : item;
  };

  if (Array.isArray(value)) {
    return value.map(coerceOne);
  }

  return coerceOne(value);
}
