/** Resource Management API types */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./common.d.ts" />

declare namespace Api {
  namespace ResourceManagement {
    interface Resource {
      id: number;
      code: string;
      name: string;
      description: string | null;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }

    interface ResourceListParams extends Common.PaginationParams {
      search?: string;
      isActive?: Common.QueryBoolean;
    }

    interface CreateResourceRequest {
      code: string;
      name: string;
      description?: string;
    }

    interface UpdateResourceRequest {
      name?: string;
      description?: string;
      isActive?: boolean;
    }

    type ResourceListResponse = ListData<Resource>;
    type ResourceDetailResponse = Resource;
    type CreateResourceResponse = Resource;
    type UpdateResourceResponse = Resource;
  }
}
