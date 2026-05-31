import { computed, onMounted, ref, shallowRef } from 'vue';
import { fetchRouteRegistry } from '@/service/api/menu';

export function useRouteRegistry() {
  const loading = ref(false);
  const registryList = shallowRef<Api.MenuManagement.RouteRegistryItem[]>([]);

  const registryMap = computed(
    () => new Map(registryList.value.map(item => [item.routeKey, item]))
  );

  const routeKeyOptions = computed(() =>
    registryList.value.map(item => ({
      label: `${item.routeKey} (${item.path})`,
      value: item.routeKey
    }))
  );

  function getRegistryItem(routeKey: string | null | undefined) {
    if (!routeKey) return undefined;
    return registryMap.value.get(routeKey as Api.MenuManagement.RouteRegistryItem['routeKey']);
  }

  async function loadRegistry() {
    loading.value = true;
    try {
      const result = await fetchRouteRegistry();
      registryList.value = result.data ?? [];
    } finally {
      loading.value = false;
    }
  }

  onMounted(loadRegistry);

  return {
    loading,
    registryList,
    registryMap,
    routeKeyOptions,
    getRegistryItem,
    loadRegistry
  };
}

export type UseRouteRegistryReturn = ReturnType<typeof useRouteRegistry>;
