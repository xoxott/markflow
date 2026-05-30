import {
  fetchAdminPermissionOptions,
  fetchAdminRoleOptions,
  fetchAdminUserOptions
} from '@/service/api/admin-reference';
import { useAdminOptionStore } from '@/store/modules/admin-option';
import type { AdminOptionListDataMap, AdminOptionResource, AdminOptionsQueryMap } from './types';

const FETCHERS = {
  roles: fetchAdminRoleOptions,
  users: fetchAdminUserOptions,
  permissions: fetchAdminPermissionOptions
} as const;

export interface FetchAdminOptionsResult<R extends AdminOptionResource> {
  data: AdminOptionListDataMap[R];
  fromCache: boolean;
  failed: boolean;
}

const EMPTY_LIST = { items: [], total: 0 };

export async function fetchAdminOptions<R extends AdminOptionResource>(
  resource: R,
  params: AdminOptionsQueryMap[R],
  store = useAdminOptionStore()
): Promise<FetchAdminOptionsResult<R>> {
  const key = store.buildCacheKey(resource, params as Record<string, unknown>);
  const cached = store.getCached(key) as AdminOptionListDataMap[R] | null;
  if (cached) {
    return { data: cached, fromCache: true, failed: false };
  }

  const { data, error } = await FETCHERS[resource](params);
  if (error || !data) {
    return { data: EMPTY_LIST as AdminOptionListDataMap[R], fromCache: false, failed: true };
  }

  store.setCached(key, data);
  return { data: data as AdminOptionListDataMap[R], fromCache: false, failed: false };
}
