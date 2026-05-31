import { describe, expect, it } from 'vitest';
import {
  menuTypeRequiresPermissionCodes,
  menuTypeRequiresRouteRegistry,
  menuTypeShowsActiveMenu,
  menuTypeShowsRouteFields,
  menuTypeUsesExternalUrl
} from '../menu-type';

describe('menu-type helpers', () => {
  it('requires permission codes for route and external', () => {
    expect(menuTypeRequiresPermissionCodes('route')).toBe(true);
    expect(menuTypeRequiresPermissionCodes('external')).toBe(true);
    expect(menuTypeRequiresPermissionCodes('group')).toBe(false);
  });

  it('requires route registry only for route', () => {
    expect(menuTypeRequiresRouteRegistry('route')).toBe(true);
    expect(menuTypeRequiresRouteRegistry('external')).toBe(false);
    expect(menuTypeRequiresRouteRegistry('group')).toBe(false);
  });

  it('shows route-only fields only for route', () => {
    expect(menuTypeShowsRouteFields('route')).toBe(true);
    expect(menuTypeShowsRouteFields('external')).toBe(false);
    expect(menuTypeShowsRouteFields('group')).toBe(false);
  });

  it('uses external URL only for external', () => {
    expect(menuTypeUsesExternalUrl('external')).toBe(true);
    expect(menuTypeUsesExternalUrl('route')).toBe(false);
    expect(menuTypeUsesExternalUrl('group')).toBe(false);
  });

  it('shows activeMenu only for hidden routes or when already set', () => {
    expect(menuTypeShowsActiveMenu({ type: 'route', hideInMenu: false, activeMenu: null })).toBe(
      false
    );
    expect(menuTypeShowsActiveMenu({ type: 'route', hideInMenu: true, activeMenu: null })).toBe(
      true
    );
    expect(menuTypeShowsActiveMenu({ type: 'route', hideInMenu: false, activeMenu: 'home' })).toBe(
      true
    );
    expect(menuTypeShowsActiveMenu({ type: 'group', hideInMenu: true, activeMenu: 'home' })).toBe(
      false
    );
  });
});
