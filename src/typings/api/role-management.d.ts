/** Role Management API types */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./common.d.ts" />

declare namespace Api {
  /**
   * namespace RoleManagement
   *
   * backend api module: "role-management"
   */
  namespace RoleManagement {
    /** Permission ref on role detail (ai-server RolePermissionOutput) */
    interface RolePermissionRef {
      id: number;
      code: string;
      name: string;
    }

    /** Parent role ref on role detail (ai-server RoleParentOutput) */
    interface RoleParentRef {
      id: number;
      code: string;
      name: string;
      level: number;
    }

    /** Role information */
    interface Role {
      id: number;
      name: string;
      code: string;
      description: string | null;
      /** 角色级别，数字越小权限越大 */
      level: number;
      isSystem: boolean;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
      permissions?: RolePermissionRef[];
      parentRole?: RoleParentRef;
      /** 拥有该角色的用户数量 */
      userCount?: number;
    }

    /** Role list query parameters */
    interface RoleListParams extends Common.PaginationParams {
      /** Search keyword (name or code) */
      search?: string;
      /** Filter by status（query: true | false） */
      isActive?: Common.QueryBoolean;
      /** Filter by system role（query: true | false） */
      isSystem?: Common.QueryBoolean;
      /** Filter roles that include this permission */
      permissionId?: number;
    }

    /** Create role request (ai-server CreateRoleInput) */
    interface CreateRoleRequest {
      name: string;
      code: string;
      description?: string;
      /** Default 999 on server when omitted */
      level?: number;
      isSystem?: boolean;
      permissionIds?: number[];
      parentRoleId?: number;
    }

    /** Update role request (ai-server UpdateRoleInput) */
    interface UpdateRoleRequest {
      name?: string;
      code?: string;
      description?: string;
      level?: number;
      permissionIds?: number[];
      parentRoleId?: number | null;
    }

    /** Role list response */
    type RoleListResponse = ListData<Role>;

    /** Create / update / detail response (ai-server returns RoleOutput) */
    type RoleDetailResponse = Role;
    type CreateRoleResponse = Role;
    type UpdateRoleResponse = Role;
  }
}
