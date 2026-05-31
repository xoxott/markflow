import { describe, expect, it, vi } from 'vitest';
import type { ElegantConstRoute } from '@elegant-router/types';
import {
  type SvgIconRenderer,
  buildDynamicGlobalMenus,
  buildStaticGlobalMenus,
  getSelectedMenuKeyPathByKey,
  transformMenuToSearchMenus
} from '../global-menus';

vi.mock('@/locales', () => ({
  $t: (key: string) => key
}));

const mockRenderIcon: SvgIconRenderer = () => () => null as never;

function route(name: string, overrides: Partial<ElegantConstRoute> = {}): ElegantConstRoute {
  return {
    name,
    path: `/${name}`,
    component: `layout.base$view.${name}`,
    meta: { title: name, i18nKey: `route.${name}` as App.I18n.I18nKey },
    ...overrides
  } as ElegantConstRoute;
}

describe('buildStaticGlobalMenus', () => {
  const routes: ElegantConstRoute[] = [
    route('home', { meta: { title: 'home', i18nKey: 'route.home', order: 1 } }),
    route('user-management', {
      meta: { title: 'user-management', i18nKey: 'route.user-management', order: 4 }
    }),
    route('role-management', {
      meta: { title: 'role-management', i18nKey: 'route.role-management', order: 5 }
    })
  ];

  it('places top-level routes before groups', () => {
    const menus = buildStaticGlobalMenus(routes, mockRenderIcon);
    expect(menus[0]?.key).toBe('home');
  });

  it('groups management routes under system-management', () => {
    const menus = buildStaticGlobalMenus(routes, mockRenderIcon);
    const systemGroup = menus.find(menu => menu.key === 'system-management');

    expect(systemGroup?.children?.map(child => child.key)).toEqual(
      expect.arrayContaining(['user-management', 'role-management'])
    );
  });

  it('does not duplicate grouped routes at root', () => {
    const menus = buildStaticGlobalMenus(routes, mockRenderIcon);
    const rootKeys = menus.filter(menu => !menu.children?.length).map(menu => menu.key);

    expect(rootKeys).not.toContain('user-management');
    expect(rootKeys).not.toContain('role-management');
  });
});

describe('buildDynamicGlobalMenus', () => {
  const serialized: Api.MenuManagement.SerializedMenuNode[] = [
    {
      type: 'group',
      sidebarKey: 'group-system',
      label: 'System',
      i18nKey: 'menuGroup.systemManagement',
      routeKey: 'user-management',
      routePath: '/user-management',
      icon: 'mdi:cog-outline',
      children: [
        {
          type: 'route',
          sidebarKey: 'user-management',
          label: 'Users',
          i18nKey: 'route.user-management',
          routeKey: 'user-management',
          routePath: '/user-management',
          icon: 'mdi:account-group'
        }
      ]
    }
  ];

  it('maps sidebarKey to menu.key and preserves nested children', () => {
    const menus = buildDynamicGlobalMenus(serialized, mockRenderIcon);

    expect(menus).toHaveLength(1);
    expect(menus[0].key).toBe('group-system');
    expect(menus[0].children).toHaveLength(1);
    expect(menus[0].children?.[0].key).toBe('user-management');
  });

  it('uses i18nKey for labels', () => {
    const menus = buildDynamicGlobalMenus(serialized, mockRenderIcon);
    expect(menus[0].label).toBe('menuGroup.systemManagement');
  });
});

describe('transformMenuToSearchMenus', () => {
  it('flattens nested menus to leaf entries', () => {
    const menus: App.Global.Menu[] = [
      {
        key: 'group',
        label: 'Group',
        routeKey: 'home',
        routePath: '/home',
        children: [
          {
            key: 'user-management',
            label: 'Users',
            routeKey: 'user-management',
            routePath: '/user-management'
          }
        ]
      }
    ];

    const flat = transformMenuToSearchMenus(menus);
    expect(flat).toHaveLength(1);
    expect(flat[0].key).toBe('user-management');
  });
});

describe('getSelectedMenuKeyPathByKey', () => {
  const menus: App.Global.Menu[] = [
    {
      key: 'system-management',
      label: 'System',
      routeKey: 'user-management',
      routePath: '/user-management',
      children: [
        {
          key: 'user-management',
          label: 'Users',
          routeKey: 'user-management',
          routePath: '/user-management'
        }
      ]
    }
  ];

  it('returns key path for nested selection', () => {
    expect(getSelectedMenuKeyPathByKey('user-management', menus)).toEqual([
      'system-management',
      'user-management'
    ]);
  });
});
