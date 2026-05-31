import { describe, expect, it } from 'vitest';
import { buildActiveMenuTreeOptions, resolveActiveMenuLabel } from '../active-menu';
import type { MenuTreeNode } from '../../types';

const tree: MenuTreeNode[] = [
  {
    id: 'group-1',
    type: 'group',
    name: '系统管理',
    sidebarKey: 'group-1',
    routeKey: 'system-management',
    parentId: null,
    order: 1,
    isActive: true,
    permissionCodes: [],
    createdAt: '',
    updatedAt: '',
    children: [
      {
        id: 'menu-user',
        type: 'route',
        name: '用户管理',
        sidebarKey: 'user-management',
        routeKey: 'user-management',
        parentId: 'group-1',
        order: 1,
        isActive: true,
        hideInMenu: false,
        permissionCodes: ['user:read'],
        createdAt: '',
        updatedAt: ''
      },
      {
        id: 'menu-editor',
        type: 'route',
        name: '用户编辑',
        sidebarKey: 'user-management-editor',
        routeKey: 'user-management-editor',
        parentId: 'group-1',
        order: 2,
        isActive: true,
        hideInMenu: true,
        permissionCodes: ['user:read'],
        createdAt: '',
        updatedAt: ''
      }
    ]
  },
  {
    id: 'group-dev',
    type: 'group',
    name: '开发工具',
    sidebarKey: 'group-dev',
    parentId: null,
    order: 2,
    isActive: true,
    permissionCodes: [],
    createdAt: '',
    updatedAt: '',
    children: [
      {
        id: 'menu-component',
        type: 'route',
        name: '组件示例',
        sidebarKey: 'component',
        routeKey: 'component',
        parentId: 'group-dev',
        order: 1,
        isActive: true,
        hideInMenu: false,
        permissionCodes: ['component:read'],
        createdAt: '',
        updatedAt: ''
      }
    ]
  }
];

describe('buildActiveMenuTreeOptions', () => {
  it('allows selecting group nodes and visible route nodes', () => {
    const options = buildActiveMenuTreeOptions(tree);

    expect(options).toHaveLength(2);
    expect(options[0]).toMatchObject({
      key: 'group-1',
      label: '系统管理',
      disabled: false
    });
    expect(options[0].children).toEqual([
      { key: 'user-management', label: '用户管理', disabled: false }
    ]);
    expect(options[1]).toMatchObject({
      key: 'group-dev',
      label: '开发工具',
      disabled: false
    });
  });

  it('excludes the current sidebar key from selectable options', () => {
    const options = buildActiveMenuTreeOptions(tree, { excludeSidebarKey: 'user-management' });

    expect(options[0].key).toBe('group-1');
    expect(options[0].children).toBeUndefined();
  });

  it('excludes the current menu id from selectable group options', () => {
    const options = buildActiveMenuTreeOptions(tree, { excludeMenuId: 'group-dev' });

    expect(options.map(option => option.key)).toEqual(['group-1', 'group:group-dev']);
    expect(options[1]?.disabled).toBe(true);
    expect(options[1]?.children?.[0]?.key).toBe('component');
  });
});

describe('resolveActiveMenuLabel', () => {
  it('resolves sidebarKey to menu names', () => {
    expect(resolveActiveMenuLabel(tree, 'group-dev')).toBe('开发工具');
    expect(resolveActiveMenuLabel(tree, 'user-management')).toBe('用户管理');
  });
});
