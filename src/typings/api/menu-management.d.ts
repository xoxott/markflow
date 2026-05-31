// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./common.d.ts" />

declare namespace Api {
  namespace MenuManagement {
    type MenuType = 'group' | 'route' | 'external';

    interface Menu {
      id: string;
      type: MenuType;
      name: string;
      i18nKey?: App.I18n.I18nKey | null;
      routeKey?: import('@elegant-router/types').RouteKey;
      icon?: string;
      parentId: string | null;
      order: number;
      isActive: boolean;
      hideInMenu?: boolean;
      activeMenu?: import('@elegant-router/types').RouteKey;
      /** Required permission codes for route-type menus */
      permissionCodes: string[];
      constant?: boolean;
      createdAt: string;
      updatedAt: string;
    }

    interface MenuTreeNode extends Menu {
      children?: MenuTreeNode[];
    }

    /** 可序列化的侧边栏节点（不含 VNode） */
    interface SerializedMenuNode {
      key: string;
      label: string;
      i18nKey?: App.I18n.I18nKey | null;
      routeKey: import('@elegant-router/types').RouteKey;
      routePath: import('@elegant-router/types').RoutePath;
      icon?: string;
      children?: SerializedMenuNode[];
    }

    interface RouteRegistryItem {
      routeKey: import('@elegant-router/types').RouteKey;
      path: string;
      title: string;
      i18nKey?: App.I18n.I18nKey | null;
      icon?: string;
      hideInMenu?: boolean;
      constant?: boolean;
      /** Suggested permission codes when syncing from route registry */
      defaultPermissionCodes?: string[];
    }

    interface SyncRoutesRequest {
      /** true = 覆盖已有节点的 order/icon/i18nKey；false = 仅新增 */
      overwrite?: boolean;
      /** Full route registry from frontend (path, component, default permission codes) */
      registry?: Array<
        RouteRegistryItem & {
          component?: string;
        }
      >;
    }

    interface SyncRoutesResult {
      created: number;
      updated: number;
      skipped: number;
    }

    interface CreateMenuRequest {
      type: MenuType;
      name: string;
      i18nKey?: App.I18n.I18nKey | null;
      routeKey?: import('@elegant-router/types').RouteKey;
      icon?: string;
      parentId?: string | null;
      order?: number;
      isActive?: boolean;
      hideInMenu?: boolean;
      activeMenu?: import('@elegant-router/types').RouteKey;
      permissionCodes?: string[];
    }

    type UpdateMenuRequest = Partial<CreateMenuRequest>;

    interface ToggleMenuStatusRequest {
      isActive: boolean;
    }

    interface MoveMenuRequest {
      targetId: string;
      position: 'before' | 'inside' | 'after';
    }

    type MenuTreeResponse = MenuTreeNode[];
    type MenuDetailResponse = Menu;
    type CreateMenuResponse = Menu;
    type UpdateMenuResponse = Menu;
    type RouteRegistryResponse = RouteRegistryItem[];
    type SyncRoutesResponse = SyncRoutesResult;
  }
}
