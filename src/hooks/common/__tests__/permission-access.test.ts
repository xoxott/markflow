import { describe, expect, it } from 'vitest';
import type { ElegantConstRoute } from '@elegant-router/types';
import { filterAuthRoutesByPermissions } from '@/store/modules/route/shared';
import {
  SUPER_PERMISSION_CODE,
  canAccessRoute,
  hasPermissionAccess,
  isSuperPermission
} from '@/utils/rbac/permission-access';

describe('permission-access', () => {
  it('recognizes super permission', () => {
    expect(isSuperPermission([SUPER_PERMISSION_CODE])).toBe(true);
    expect(isSuperPermission(['user:read'])).toBe(false);
  });

  it('grants access when user codes intersect required codes', () => {
    expect(hasPermissionAccess(['user:read', 'role:read'], ['user:read'])).toBe(true);
    expect(hasPermissionAccess(['user:read'], ['role:read'])).toBe(false);
  });

  it('allows empty required permission lists', () => {
    expect(hasPermissionAccess([], [])).toBe(true);
  });
});

describe('canAccessRoute', () => {
  it('denies when route permissionCodes is empty', () => {
    expect(canAccessRoute(['user:read'], [])).toBe(false);
    expect(canAccessRoute(['user:read'], undefined)).toBe(false);
  });

  it('allows when user codes intersect required codes', () => {
    expect(canAccessRoute(['user:read'], ['user:read'])).toBe(true);
    expect(canAccessRoute(['user:read'], ['role:read'])).toBe(false);
  });

  it('allows super permission regardless of required codes', () => {
    expect(canAccessRoute(['*:*'], ['admin:write'])).toBe(true);
  });
});

describe('filterAuthRoutesByPermissions', () => {
  const leafRoute: ElegantConstRoute = {
    name: 'user-management',
    path: '/user-management',
    component: 'layout.base$view.user-management',
    meta: {
      title: 'user-management',
      permissionCodes: ['user:read']
    }
  };

  const parentWithChild: ElegantConstRoute = {
    name: 'admin',
    path: '/admin',
    component: 'layout.base',
    meta: { title: 'admin' },
    children: [leafRoute]
  };

  it('denies leaf routes without permissionCodes meta', () => {
    const noMeta: ElegantConstRoute = {
      name: 'orphan',
      path: '/orphan',
      component: 'layout.base$view.orphan',
      meta: { title: 'orphan' }
    };
    expect(filterAuthRoutesByPermissions([noMeta], ['user:read'])).toHaveLength(0);
  });

  it('filters leaf routes by permission intersection', () => {
    expect(filterAuthRoutesByPermissions([leafRoute], ['user:read'])).toHaveLength(1);
    expect(filterAuthRoutesByPermissions([leafRoute], ['role:read'])).toHaveLength(0);
  });

  it('keeps constant routes regardless of permissions', () => {
    const constant: ElegantConstRoute = {
      name: '403',
      path: '/403',
      component: 'layout.blank$view.403',
      meta: { title: '403', constant: true }
    };
    expect(filterAuthRoutesByPermissions([constant], [])).toHaveLength(1);
  });

  it('prunes parent when all children are denied', () => {
    expect(filterAuthRoutesByPermissions([parentWithChild], ['role:read'])).toHaveLength(0);
    expect(filterAuthRoutesByPermissions([parentWithChild], ['user:read'])).toHaveLength(1);
  });
});
