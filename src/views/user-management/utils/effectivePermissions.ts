type EffectivePermission = Api.UserManagement.EffectivePermission;

export function pickDirectPermissions(permissions: EffectivePermission[]): EffectivePermission[] {
  return permissions.filter(item => item.source === 'direct');
}

export function excludeExistingPermissionIds(
  permissionIds: number[],
  existingIds: Iterable<number>
): number[] {
  const existing = new Set(existingIds);
  return permissionIds.filter(id => !existing.has(id));
}
