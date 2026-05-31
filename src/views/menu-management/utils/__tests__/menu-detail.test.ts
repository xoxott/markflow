import { describe, expect, it } from 'vitest';
import { buildMenuDetailItems } from '../menu-detail';

vi.mock('@/locales', () => ({
  $t: (key: string) => key
}));

const baseNode = {
  id: 'menu-1',
  name: 'Users',
  sidebarKey: 'menu-1',
  i18nKey: 'route.user-management',
  icon: 'mdi:account',
  parentId: null,
  order: 1,
  isActive: true,
  permissionCodes: ['user:read'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  type: 'group'
} satisfies Api.MenuManagement.MenuTreeNode;

describe('buildMenuDetailItems', () => {
  it('shows only group fields for group nodes', () => {
    const items = buildMenuDetailItems({ ...baseNode, type: 'group', permissionCodes: [] });
    const keys = items.map(item => item.key);

    expect(keys).toEqual(['icon', 'i18nKey', 'order', 'updatedAt']);
  });

  it('joins route registry path for route nodes', () => {
    const items = buildMenuDetailItems(
      {
        ...baseNode,
        type: 'route',
        sidebarKey: 'user-management',
        routeKey: 'user-management',
        hideInMenu: false
      },
      {
        routeKey: 'user-management',
        path: '/user-management',
        title: 'Users'
      }
    );
    const keys = items.map(item => item.key);

    expect(keys).toContain('routeKey');
    expect(keys).toContain('path');
    expect(keys).toContain('hideInMenu');
    expect(keys).not.toContain('activeMenu');
    expect(keys).toContain('permissionCodes');
    expect(items.find(item => item.key === 'path')?.value).toBe('/user-management');
  });

  it('shows activeMenu only for hidden route nodes', () => {
    const tree: Api.MenuManagement.MenuTreeNode[] = [
      {
        ...baseNode,
        type: 'route',
        sidebarKey: 'agent-management',
        routeKey: 'agent-management',
        name: 'Agent Management'
      }
    ];
    const items = buildMenuDetailItems(
      {
        ...baseNode,
        type: 'route',
        sidebarKey: 'agent-management-editor',
        routeKey: 'agent-management-editor',
        hideInMenu: true,
        activeMenu: 'agent-management'
      },
      undefined,
      tree
    );
    const keys = items.map(item => item.key);

    expect(keys).toContain('activeMenu');
    expect(items.find(item => item.key === 'activeMenu')?.value).toBe('Agent Management');
  });

  it('shows external URL for external nodes', () => {
    const items = buildMenuDetailItems({
      ...baseNode,
      type: 'external',
      sidebarKey: 'https://docs.example.com',
      routeKey: 'https://docs.example.com',
      permissionCodes: ['user:read']
    });
    const keys = items.map(item => item.key);

    expect(keys).toContain('externalUrl');
    expect(keys).not.toContain('path');
    expect(keys).not.toContain('hideInMenu');
    expect(items.find(item => item.key === 'externalUrl')?.value).toBe('https://docs.example.com');
  });
});
