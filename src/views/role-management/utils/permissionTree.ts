import type { TreeOption } from 'naive-ui';

/** 将权限列表映射为 NTreeSelect 选项（后端无 tree 接口，扁平展示） */
export function mapPermissionListToOptions(
  permissions: Api.PermissionManagement.Permission[]
): TreeOption[] {
  return permissions.map(p => ({
    key: p.id,
    label: `${p.name} (${p.code})`,
    disabled: !p.isActive
  }));
}
