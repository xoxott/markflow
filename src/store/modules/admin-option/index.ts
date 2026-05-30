import { ref } from 'vue';
import { defineStore } from 'pinia';
import { SetupStoreId } from '@/enum';
import { buildAdminOptionCacheKey } from './cacheKey';

export { buildAdminOptionCacheKey };

const DEFAULT_TTL_MS = 30_000;

type AdminOptionResource = Api.AdminReference.AdminOptionResource;
type AdminOptionListData = Api.AdminReference.AdminOptionListDataMap[AdminOptionResource];
type AdminOptionsQuery = Api.AdminReference.AdminOptionsQueryMap[AdminOptionResource];

interface CacheEntry {
  data: AdminOptionListData;
  expiresAt: number;
}

export const useAdminOptionStore = defineStore(SetupStoreId.AdminOption, () => {
  const cache = ref(new Map<string, CacheEntry>());

  function getCached(key: string): AdminOptionListData | null {
    const entry = cache.value.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      cache.value.delete(key);
      return null;
    }
    return entry.data;
  }

  function setCached(key: string, data: AdminOptionListData, ttlMs = DEFAULT_TTL_MS) {
    cache.value.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  function invalidateResource(resource: AdminOptionResource | 'all') {
    if (resource === 'all') {
      cache.value.clear();
      return;
    }

    for (const key of cache.value.keys()) {
      if (key.startsWith(`${resource}:`)) {
        cache.value.delete(key);
      }
    }
  }

  return {
    buildCacheKey: (resource: AdminOptionResource, params: AdminOptionsQuery) =>
      buildAdminOptionCacheKey(resource, params as Record<string, unknown>),
    getCached,
    setCached,
    invalidateResource
  };
});

export type { AdminOptionsQuery };
