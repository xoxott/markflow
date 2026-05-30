/** Admin reference / options API types（与 ai-server docs/admin-options-api.md 一致） */

declare namespace Api {
  namespace AdminReference {
    /** 三个 options 接口共用的查询参数（OptionsQueryDto） */
    interface OptionsBaseQuery {
      search?: string;
      limit?: number;
      includeDisabled?: boolean;
    }

    /** GET /admin/roles/options */
    interface RoleOptionsQuery extends OptionsBaseQuery {
      isSystem?: boolean;
    }

    /** GET /admin/users/options */
    interface UserOptionsQuery extends OptionsBaseQuery {
      roleCode?: string;
    }

    /** GET /admin/permissions/options */
    interface PermissionOptionsQuery extends OptionsBaseQuery {
      resource?: string;
      action?: string;
    }

    type AdminOptionResource = 'roles' | 'users' | 'permissions';

    type AdminOptionsQueryMap = {
      roles: RoleOptionsQuery;
      users: UserOptionsQuery;
      permissions: PermissionOptionsQuery;
    };

    /** 后端 SelectOptionOutput：value 恒为实体 ID */
    interface SelectOption {
      value: number;
      label: string;
      disabled?: boolean;
    }

    interface RoleOption extends SelectOption {
      code: string;
      level?: number;
      isSystem?: boolean;
    }

    interface UserOption extends SelectOption {
      username?: string;
      email?: string;
    }

    interface PermissionOption extends SelectOption {
      code?: string;
      resource?: string;
      action?: string;
    }

    type AdminOptionItemMap = {
      roles: RoleOption;
      users: UserOption;
      permissions: PermissionOption;
    };

    type AdminOptionListDataMap = {
      [K in AdminOptionResource]: {
        items: AdminOptionItemMap[K][];
        total: number;
      };
    };
  }
}
