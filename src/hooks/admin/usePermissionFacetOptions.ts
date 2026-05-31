import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { fetchAdminPermissionActionOptions } from '@/service/api/admin-reference';
import { fetchResourceOptions } from '@/service/api/resource';
import { buildPermissionFacetCacheKey, useAdminOptionStore } from '@/store/modules/admin-option';
import type { PermissionFacetKind } from '@/store/modules/admin-option/cacheKey';
import type { UiOptionItem } from './types';

export interface UsePermissionFacetOptionsConfig {
  /** actions 维度必填：所属 resource */
  resource?: Ref<string | null | undefined> | string | null | undefined;
  limit?: number;
  includeDisabled?: boolean;
}

function resolveResource(
  resource: UsePermissionFacetOptionsConfig['resource']
): string | undefined {
  if (resource === null || resource === undefined || resource === '') {
    return undefined;
  }
  if (typeof resource === 'object' && 'value' in resource) {
    const value = (resource as Ref<string | null | undefined>).value;
    return value && value !== '' ? value : undefined;
  }
  return resource;
}

export function usePermissionFacetOptions(
  facet: PermissionFacetKind,
  config: UsePermissionFacetOptionsConfig = {}
) {
  const store = useAdminOptionStore();
  const options = ref<UiOptionItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const loadFailed = ref(false);
  const initialLoaded = ref(false);

  let fetchSeq = 0;

  async function fetchOptions(searchText: string) {
    const seq = ++fetchSeq;
    const resource = resolveResource(config.resource);
    if (facet === 'actions' && !resource) {
      options.value = [];
      total.value = 0;
      loadFailed.value = false;
      initialLoaded.value = false;
      return;
    }

    const params = {
      limit: config.limit ?? 50,
      includeDisabled: config.includeDisabled ?? false,
      search: searchText.trim() || undefined,
      ...(facet === 'actions' ? { resource: resource! } : {})
    };

    const cacheKey = buildPermissionFacetCacheKey(facet, params);
    loading.value = true;
    loadFailed.value = false;

    try {
      const cached = store.getCached(
        cacheKey
      ) as Api.AdminReference.PermissionFacetOptionListData | null;
      let data = cached;

      if (!data) {
        const result =
          facet === 'resources'
            ? await fetchResourceOptions(params)
            : await fetchAdminPermissionActionOptions(
                params as Api.AdminReference.PermissionActionOptionsQuery
              );

        if (seq !== fetchSeq) {
          return;
        }

        if (result.error || !result.data) {
          loadFailed.value = true;
          if (options.value.length === 0) {
            options.value = [];
            total.value = 0;
          }
          return;
        }

        data = result.data;
        store.setCached(
          cacheKey,
          data as unknown as Api.AdminReference.AdminOptionListDataMap['permissions']
        );
      }

      if (seq !== fetchSeq) {
        return;
      }

      options.value = data.items.map(item => ({
        value: item.value,
        label: item.label
      }));
      total.value = data.total;
    } finally {
      if (seq === fetchSeq) {
        loading.value = false;
        initialLoaded.value = true;
      }
    }
  }

  const debouncedFetch = useDebounceFn((query: string) => {
    fetchOptions(query).catch(() => undefined);
  }, 300);

  function search(query: string) {
    debouncedFetch(query);
  }

  function loadInitial() {
    return fetchOptions('');
  }

  function reset() {
    fetchSeq += 1;
    options.value = [];
    total.value = 0;
    loadFailed.value = false;
    initialLoaded.value = false;
  }

  if (config.resource && typeof config.resource === 'object' && 'value' in config.resource) {
    watch(
      config.resource as Ref<string | null | undefined>,
      () => {
        reset();
        if (facet === 'resources' || resolveResource(config.resource)) {
          loadInitial().catch(() => undefined);
        }
      },
      { immediate: false }
    );
  }

  return {
    options,
    total,
    loading,
    loadFailed,
    initialLoaded,
    search,
    loadInitial,
    reset
  };
}
