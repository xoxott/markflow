/** User Management API types */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./common.d.ts" />

declare namespace Api {
  /**
   * namespace UserManagement
   *
   * backend api module: "user-management"
   */
  namespace UserManagement {
    /** Role information */
    interface Role {
      id: number;
      name: string;
      code: string;
    }

    /** User information */
    interface User {
      id: number;
      username: string;
      email: string;
      avatar: string | null;
      isActive: boolean;
      isOnline: boolean;
      isBlacklisted: boolean;
      blacklistedAt: string | null;
      blacklistReason: string | null;
      lastLoginAt: string | null;
      lastActivityAt: string | null;
      createdAt: string;
      updatedAt: string;
      roles: Role[];
    }

    /** User list query parameters */
    interface UserListParams extends Common.PaginationParams {
      /** Search keyword (username or email) */
      search?: string;
      /** Filter by status（query: true | false） */
      isActive?: Common.QueryBoolean;
      /** Filter by online status（query: true | false） */
      isOnline?: Common.QueryBoolean;
      /** Filter by blacklist status（query: true | false） */
      isBlacklisted?: Common.QueryBoolean;
      /** Filter by role code */
      roleCode?: string;
    }

    /** Create user request (ai-server CreateUserInput) */
    interface CreateUserRequest {
      username: string;
      email: string;
      password: string;
      verificationCode: string;
    }

    /** Update user request (ai-server UpdateUserInput) */
    interface UpdateUserRequest {
      username?: string;
      email?: string;
      password?: string;
      avatar?: string;
    }

    /** Batch delete users request (ai-server BatchDeleteInput) */
    interface BatchDeleteUsersRequest {
      userIds: number[];
    }

    /** Batch update user status request (ai-server BatchUpdateStatusInput) */
    interface BatchUpdateStatusRequest {
      userIds: number[];
      isActive: boolean;
      reason?: string;
    }

    /** User list response (after transformBackendResponse) */
    type UserListResponse = ListData<User>;

    /** User detail response */
    type UserDetailResponse = User;

    /** Create / update user response (ai-server returns UserOutput) */
    type CreateUserResponse = User;
    type UpdateUserResponse = User;

    /** Delete user response */
    type DeleteUserResponse = null;

    /** Batch delete users response */
    interface BatchDeleteUsersResponse {
      deleted: number;
    }

    /** Batch update user status response */
    interface BatchUpdateStatusResponse {
      updated: number;
    }

    /** Role list response (after transformBackendResponse) */
    type RoleListResponse = ListData<Role>;
  }
}
