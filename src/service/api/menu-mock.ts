/** Mock Menu Management + dynamic route provider */

import { v4 as uuidv4 } from 'uuid';
import type { ElegantConstRoute } from '@elegant-router/types';
import {
  filterMenuTreeByRoles,
  getDefaultHomeRoute,
  getRouteRegistryItems,
  isValidRouteKey,
  menuTreeToAuthRoutes,
  menuTreeToSerializedSidebarMenus
} from '@/service/menu/buildUserRoutes';
import { generatedRoutes } from '@/router/elegant/routes';
import {
  MENU_GROUP_DEFINITIONS,
  type MenuGroupChild,
  type MenuSubGroupDefinition,
  TOP_LEVEL_MENU_KEYS
} from '@/router/menu/menu-groups';

type Menu = Api.MenuManagement.Menu;
type MenuTreeNode = Api.MenuManagement.MenuTreeNode;

const delay = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

const createMockResponse = <T>(data: T) => ({
  data,
  error: null,
  response: {} as Record<string, unknown>
});

const now = () => new Date().toISOString();

let menuStore: Menu[] = [];
let seeded = false;

function createMenu(partial: Omit<Menu, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Menu {
  const timestamp = now();
  return {
    id: partial.id ?? uuidv4(),
    createdAt: timestamp,
    updatedAt: timestamp,
    ...partial
  };
}

function buildTree(flatMenus: Menu[]): MenuTreeNode[] {
  const map = new Map<string, MenuTreeNode>();
  flatMenus.forEach(item => {
    map.set(item.id, { ...item, children: [] });
  });

  const roots: MenuTreeNode[] = [];

  map.forEach(node => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes: MenuTreeNode[]) => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach(node => {
      if (node.children?.length) {
        sortNodes(node.children);
      } else {
        delete node.children;
      }
    });
  };

  sortNodes(roots);
  return roots;
}

function getRouteMeta(routeKey: string) {
  return generatedRoutes.find(route => route.name === routeKey)?.meta;
}

function upsertRouteMenu(
  routeKey: string,
  parentId: string | null,
  order: number,
  overwrite: boolean
): 'created' | 'updated' | 'skipped' {
  const meta = getRouteMeta(routeKey);
  const existing = menuStore.find(item => item.type === 'route' && item.routeKey === routeKey);

  if (existing) {
    if (!overwrite) return 'skipped';
    existing.parentId = parentId;
    existing.order = order;
    existing.name = String(meta?.title ?? routeKey);
    existing.i18nKey = meta?.i18nKey ?? null;
    existing.icon = meta?.icon;
    existing.hideInMenu = meta?.hideInMenu ?? undefined;
    existing.activeMenu = meta?.activeMenu ?? undefined;
    existing.updatedAt = now();
    return 'updated';
  }

  menuStore.push(
    createMenu({
      type: 'route',
      name: String(meta?.title ?? routeKey),
      i18nKey: meta?.i18nKey ?? null,
      routeKey: routeKey as Menu['routeKey'],
      icon: meta?.icon,
      parentId,
      order,
      isActive: true,
      hideInMenu: meta?.hideInMenu ?? undefined,
      activeMenu: meta?.activeMenu ?? undefined,
      roleCodes: [],
      constant: Boolean(meta?.constant)
    })
  );
  return 'created';
}

function upsertGroupMenu(
  key: string,
  name: string,
  i18nKey: App.I18n.I18nKey,
  icon: string,
  parentId: string | null,
  order: number,
  overwrite: boolean
): Menu {
  const existing = menuStore.find(
    item => item.id === key || (item.type === 'group' && item.name === name)
  );
  if (existing) {
    if (overwrite) {
      existing.parentId = parentId;
      existing.order = order;
      existing.i18nKey = i18nKey;
      existing.icon = icon;
      existing.name = name;
      existing.updatedAt = now();
    }
    return existing;
  }

  const group = createMenu({
    id: key,
    type: 'group',
    name,
    i18nKey,
    icon,
    parentId,
    order,
    isActive: true,
    roleCodes: []
  });
  menuStore.push(group);
  return group;
}

function syncGroupChild(
  child: MenuGroupChild,
  parentId: string,
  orderStart: number,
  overwrite: boolean
): number {
  let order = orderStart;

  if (typeof child === 'string') {
    upsertRouteMenu(child, parentId, order, overwrite);
    return order + 1;
  }

  const subgroup = child as MenuSubGroupDefinition;
  const group = upsertGroupMenu(
    subgroup.key,
    subgroup.key,
    subgroup.i18nKey,
    subgroup.icon,
    parentId,
    order,
    overwrite
  );
  order += 1;

  subgroup.children.forEach((routeKey, index) => {
    upsertRouteMenu(routeKey, group.id, index + 1, overwrite);
  });

  return order + subgroup.children.length;
}

function buildSeedMenus(overwrite = false): Api.MenuManagement.SyncRoutesResult {
  const result: Api.MenuManagement.SyncRoutesResult = { created: 0, updated: 0, skipped: 0 };

  const track = (status: 'created' | 'updated' | 'skipped') => {
    result[status] += 1;
  };

  TOP_LEVEL_MENU_KEYS.forEach(({ key, order }) => {
    track(upsertRouteMenu(key, null, order, overwrite));
  });

  MENU_GROUP_DEFINITIONS.forEach(groupDef => {
    const group = upsertGroupMenu(
      groupDef.key,
      groupDef.key,
      groupDef.i18nKey,
      groupDef.icon,
      null,
      groupDef.order,
      overwrite
    );

    let childOrder = 1;
    groupDef.children.forEach(child => {
      childOrder = syncGroupChild(child, group.id, childOrder, overwrite);
    });
  });

  // 菜单管理页（挂在系统管理下）
  const systemGroup = menuStore.find(item => item.id === 'system-management');
  if (systemGroup) {
    const status = upsertRouteMenu('menu-management', systemGroup.id, 20, overwrite);
    track(status);
  } else {
    track(upsertRouteMenu('menu-management', null, 99, overwrite));
  }

  return result;
}

function ensureSeeded() {
  if (seeded && menuStore.length > 0) return;
  menuStore = [];
  buildSeedMenus(false);
  seeded = true;
}

function findMenu(id: string): Menu | undefined {
  return menuStore.find(item => item.id === id);
}

function validateParent(parentId: string | null | undefined, selfId?: string) {
  if (!parentId) return;
  const parent = findMenu(parentId);
  if (!parent) throw new Error('父级菜单不存在');
  if (parent.type !== 'group') throw new Error('父级必须是分组类型');
  if (selfId && parentId === selfId) throw new Error('不能将自身设为父级');
}

function validateRouteKey(type: Menu['type'], routeKey?: string) {
  if (type !== 'route') return;
  if (!routeKey) throw new Error('页面类型菜单必须绑定 routeKey');
  if (!isValidRouteKey(routeKey)) throw new Error('routeKey 不存在于前端路由注册表');
  const duplicate = menuStore.find(item => item.type === 'route' && item.routeKey === routeKey);
  if (duplicate) throw new Error('routeKey 已被其他菜单占用');
}

export const mockMenuApi = {
  ensureSeeded,

  async fetchMenuTree() {
    await delay(200);
    ensureSeeded();
    return createMockResponse(buildTree(menuStore));
  },

  async fetchMenuDetail(id: string) {
    await delay(150);
    ensureSeeded();
    const menu = findMenu(id);
    if (!menu) throw new Error('菜单不存在');
    return createMockResponse(menu);
  },

  async fetchCreateMenu(data: Api.MenuManagement.CreateMenuRequest) {
    await delay(250);
    ensureSeeded();
    validateParent(data.parentId ?? null);
    validateRouteKey(data.type, data.routeKey);

    const menu = createMenu({
      type: data.type,
      name: data.name,
      i18nKey: data.i18nKey ?? null,
      routeKey: data.routeKey,
      icon: data.icon,
      parentId: data.parentId ?? null,
      order: data.order ?? menuStore.length + 1,
      isActive: data.isActive ?? true,
      hideInMenu: data.hideInMenu,
      activeMenu: data.activeMenu,
      roleCodes: data.roleCodes ?? []
    });

    menuStore.push(menu);
    return createMockResponse(menu);
  },

  async fetchUpdateMenu(id: string, data: Api.MenuManagement.UpdateMenuRequest) {
    await delay(250);
    ensureSeeded();
    const menu = findMenu(id);
    if (!menu) throw new Error('菜单不存在');

    if (data.parentId !== undefined) validateParent(data.parentId, id);
    if (data.type === 'route' || menu.type === 'route') {
      const nextKey = data.routeKey ?? menu.routeKey;
      if (nextKey && nextKey !== menu.routeKey) {
        if (!isValidRouteKey(nextKey)) throw new Error('routeKey 不存在于前端路由注册表');
        const duplicate = menuStore.find(
          item => item.id !== id && item.type === 'route' && item.routeKey === nextKey
        );
        if (duplicate) throw new Error('routeKey 已被其他菜单占用');
      }
    }

    Object.assign(menu, data, { updatedAt: now() });
    return createMockResponse(menu);
  },

  async fetchDeleteMenu(id: string) {
    await delay(200);
    ensureSeeded();
    const hasChildren = menuStore.some(item => item.parentId === id);
    if (hasChildren) throw new Error('请先删除子菜单');
    const index = menuStore.findIndex(item => item.id === id);
    if (index < 0) throw new Error('菜单不存在');
    menuStore.splice(index, 1);
    return createMockResponse(null);
  },

  async fetchToggleMenuStatus(id: string, isActive: boolean) {
    await delay(150);
    ensureSeeded();
    const menu = findMenu(id);
    if (!menu) throw new Error('菜单不存在');
    menu.isActive = isActive;
    menu.updatedAt = now();
    return createMockResponse(menu);
  },

  async fetchMoveMenu(id: string, data: Api.MenuManagement.MoveMenuRequest) {
    await delay(200);
    ensureSeeded();

    const menu = findMenu(id);
    if (!menu) throw new Error('菜单不存在');

    const target = findMenu(data.targetId);
    if (!target) throw new Error('目标节点不存在');
    if (id === data.targetId) throw new Error('不能移动到自身');

    const collectDescendantIds = (parentId: string): Set<string> => {
      const ids = new Set<string>();
      const walk = (pid: string) => {
        menuStore
          .filter(item => item.parentId === pid)
          .forEach(item => {
            ids.add(item.id);
            walk(item.id);
          });
      };
      walk(parentId);
      return ids;
    };

    if (collectDescendantIds(id).has(data.targetId)) {
      throw new Error('不能移动到子节点下');
    }

    if (data.position === 'inside') {
      if (target.type !== 'group') throw new Error('只能移入分组节点');
      validateParent(data.targetId, id);
      menu.parentId = data.targetId;
    } else {
      validateParent(target.parentId, id);
      menu.parentId = target.parentId;
    }

    const siblingParentId = menu.parentId;
    const siblings = menuStore
      .filter(item => item.parentId === siblingParentId && item.id !== id)
      .sort((a, b) => a.order - b.order);

    let insertIndex = siblings.length;
    if (data.position !== 'inside') {
      const targetIndex = siblings.findIndex(item => item.id === data.targetId);
      insertIndex = data.position === 'before' ? targetIndex : targetIndex + 1;
      if (insertIndex < 0) insertIndex = siblings.length;
    }

    siblings.splice(insertIndex, 0, menu);
    siblings.forEach((item, index) => {
      item.order = index + 1;
      item.updatedAt = now();
    });

    return createMockResponse(menu);
  },

  async fetchSyncRoutes(data: Api.MenuManagement.SyncRoutesRequest = {}) {
    await delay(400);
    const result = buildSeedMenus(Boolean(data.overwrite));
    seeded = true;
    return createMockResponse(result);
  },

  async fetchRouteRegistry() {
    await delay(100);
    return createMockResponse(getRouteRegistryItems());
  },

  async fetchGetConstantRoutes() {
    await delay(100);
    const constants = generatedRoutes.filter(route => route.meta?.constant) as ElegantConstRoute[];
    return createMockResponse(constants.map(route => ({ ...route, id: `constant-${route.name}` })));
  },

  async fetchGetUserRoutes(roleCodes: string[] = []) {
    await delay(200);
    ensureSeeded();
    const tree = buildTree(menuStore);
    const filtered = filterMenuTreeByRoles(tree, roleCodes);
    const routes = menuTreeToAuthRoutes(filtered);
    const menus = menuTreeToSerializedSidebarMenus(filtered);

    return createMockResponse({
      routes,
      home: getDefaultHomeRoute(),
      menus
    });
  },

  /** 供 route store reload 后读取最新菜单树 */
  getFlatMenus(): Menu[] {
    ensureSeeded();
    return [...menuStore];
  },

  /** 测试/重置 */
  resetStore() {
    menuStore = [];
    seeded = false;
    ensureSeeded();
  }
};

export type MenuMockApi = typeof mockMenuApi;
