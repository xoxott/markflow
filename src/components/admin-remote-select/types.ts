import type {
  AdminOptionResource,
  AdminOptionsQueryMap,
  OptionValueKey
} from '@/hooks/admin/types';

/** 与 resource 对应的 query；例：AdminRemoteSelectQuery<'roles'> */
export type AdminRemoteSelectQuery<R extends AdminOptionResource = AdminOptionResource> = Partial<
  AdminOptionsQueryMap[R]
>;

type SelectValue = string | number | Array<string | number> | null;

/** AdminRemoteSelect 公共 props（不含 resource / query） */
interface AdminRemoteSelectSharedProps {
  'value'?: SelectValue;
  'placeholder'?: string;
  'multiple'?: boolean;
  'clearable'?: boolean;
  'disabled'?: boolean;
  'includeDisabled'?: boolean;
  'limit'?: number;
  'valueKey'?: OptionValueKey;
  'maxTagCount'?: number | 'responsive';
  'style'?: string | Record<string, string>;
  'excludeValues'?: Array<string | number>;
  'class'?: string;
  'onUpdate:value'?: (value: SelectValue) => void;
}

/** resource 为字面量时 query 类型随 resource 收窄 */
export type AdminRemoteSelectProps = {
  [R in AdminOptionResource]: AdminRemoteSelectSharedProps & {
    resource: R;
    query?: AdminRemoteSelectQuery<R>;
  };
}[AdminOptionResource];
