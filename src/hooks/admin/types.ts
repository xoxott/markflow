export type AdminOptionResource = Api.AdminReference.AdminOptionResource;
export type AdminOptionsQueryMap = Api.AdminReference.AdminOptionsQueryMap;
export type AdminOptionItemMap = Api.AdminReference.AdminOptionItemMap;
export type AdminOptionListDataMap = Api.AdminReference.AdminOptionListDataMap;

/** NSelect 绑定字段：默认 value（实体 ID），或 item 上的其它字段如 code */
export type OptionValueKey = 'value' | (string & {});

/** NSelect 使用的选项（valueKey 映射后 value 可能与实体 ID 不同） */
export interface UiOptionItem {
  value: string | number;
  label: string;
  disabled?: boolean;
}
