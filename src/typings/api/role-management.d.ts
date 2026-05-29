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
    }

    /** Role list query parameters */
    interface RoleListParams extends Common.PaginationParams {
      /** Search keyword (name or code) */
      search?: string;
      /** Filter by status: 1 启用 / 0 停用（Select 用数字，请求时转为 boolean） */
      isActive?: number;
      isSystem?: boolean;
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
