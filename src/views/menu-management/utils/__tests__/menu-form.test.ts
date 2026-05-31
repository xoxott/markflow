import { describe, expect, it } from 'vitest';
import { formDataToCreateRequest } from '../menu-form';

describe('formDataToCreateRequest', () => {
  it('trims route-only fields for group menus', () => {
    const request = formDataToCreateRequest({
      type: 'group',
      name: 'System',
      i18nKey: '',
      routeKey: 'home',
      icon: '',
      parentId: null,
      order: 1,
      isActive: true,
      hideInMenu: true,
      activeMenu: 'home',
      permissionCodes: ['menu:read']
    });

    expect(request.routeKey).toBeUndefined();
    expect(request.hideInMenu).toBeUndefined();
    expect(request.activeMenu).toBeUndefined();
    expect(request.permissionCodes).toEqual([]);
  });

  it('maps external URL and permission codes for external menus', () => {
    const request = formDataToCreateRequest({
      type: 'external',
      name: 'Docs',
      i18nKey: '',
      routeKey: 'https://docs.example.com',
      icon: '',
      parentId: null,
      order: 2,
      isActive: true,
      hideInMenu: false,
      activeMenu: '',
      permissionCodes: ['user:read']
    });

    expect(request.routeKey).toBe('https://docs.example.com');
    expect(request.hideInMenu).toBeUndefined();
    expect(request.activeMenu).toBeUndefined();
    expect(request.permissionCodes).toEqual(['user:read']);
  });

  it('omits activeMenu when hideInMenu is false', () => {
    const request = formDataToCreateRequest({
      type: 'route',
      name: 'Component',
      i18nKey: '',
      routeKey: 'component',
      icon: '',
      parentId: null,
      order: 1,
      isActive: true,
      hideInMenu: false,
      activeMenu: 'dev-tools',
      permissionCodes: ['component:read']
    });

    expect(request.activeMenu).toBeUndefined();
  });

  it('includes activeMenu only when hideInMenu is true', () => {
    const request = formDataToCreateRequest({
      type: 'route',
      name: 'Component',
      i18nKey: '',
      routeKey: 'component',
      icon: '',
      parentId: null,
      order: 1,
      isActive: true,
      hideInMenu: true,
      activeMenu: 'dev-tools',
      permissionCodes: ['component:read']
    });

    expect(request.activeMenu).toBe('dev-tools');
  });
});
