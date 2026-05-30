import type { AdminOptionListDataMap, AdminOptionResource, UiOptionItem } from './types';

/** 将 API 选项映射为 NSelect 选项。 valueKey 默认 'value'（实体 ID）；可指定 item 上其它字段如 'code'。 */
export function mapOptionsToUi<R extends AdminOptionResource>(
  data: AdminOptionListDataMap[R],
  valueKey = 'value'
): UiOptionItem[] {
  return data.items.map(item => {
    if (valueKey === 'value') {
      return {
        value: item.value,
        label: item.label,
        disabled: item.disabled
      };
    }

    const fieldValue = (item as unknown as Record<string, unknown>)[valueKey];
    return {
      value: (fieldValue ?? item.value) as string | number,
      label: item.label,
      disabled: item.disabled
    };
  });
}
