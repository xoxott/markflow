export const SUPER_PERMISSION_CODE = '*:*';

/** Whether the user holds a wildcard super permission. */
export function isSuperPermission(permissionCodes: string[]): boolean {
  return permissionCodes.includes(SUPER_PERMISSION_CODE);
}

/** Whether user permission codes satisfy required menu/route permission codes. */
export function hasPermissionAccess(
  userPermissionCodes: string[],
  requiredPermissionCodes: string[]
): boolean {
  if (isSuperPermission(userPermissionCodes)) {
    return true;
  }

  if (!requiredPermissionCodes.length) {
    return true;
  }

  if (!userPermissionCodes.length) {
    return false;
  }

  const userSet = new Set(userPermissionCodes);
  return requiredPermissionCodes.some(code => userSet.has(code));
}

/**
 * Whether the user may enter an auth route. Non-constant routes without permissionCodes are denied
 * (aligned with static route filter).
 */
export function canAccessRoute(
  userPermissionCodes: string[],
  routePermissionCodes: string[] | undefined
): boolean {
  if (isSuperPermission(userPermissionCodes)) {
    return true;
  }

  const required = routePermissionCodes ?? [];
  if (!required.length) {
    return false;
  }

  return hasPermissionAccess(userPermissionCodes, required);
}
