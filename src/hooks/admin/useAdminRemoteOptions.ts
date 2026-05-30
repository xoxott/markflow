import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useAdminOptionStore } from '@/store/modules/admin-option';
import { buildPresetOptionsFromValues, mergeAdminOptionItems } from './adminOptionUtils';
import { fetchAdminOptions } from './fetchAdminOptions';
import { mapOptionsToUi } from './normalizeOptions';
import type {
  AdminOptionResource,
  AdminOptionsQueryMap,
  OptionValueKey,
  UiOptionItem
} from './types';

export interface UseAdminRemoteOptionsConfig<R extends AdminOptionResource> {
  query?: Partial<AdminOptionsQueryMap[R]> | Ref<Partial<AdminOptionsQueryMap[R]> | undefined>;
  /** UI 绑定字段，默认 value（实体 ID） */
  valueKey?: OptionValueKey | Ref<OptionValueKey>;
  presetValues?:
    | Ref<Array<string | number> | string | number | null | undefined>
    | Array<string | number>
    | string
    | number
    | null
    | undefined;
  /** 已选值的回显选项（含 label）；优先于 presetValues 生成的占位项 */
  presetOptions?: Ref<UiOptionItem[] | undefined> | UiOptionItem[];
}

function resolveConfigQuery<R extends AdminOptionResource>(
  query: UseAdminRemoteOptionsConfig<R>['query']
): Partial<AdminOptionsQueryMap[R]> {
  if (!query) {
    return {};
  }
  if (typeof query === 'object' && 'value' in query) {
    return (query as Ref<Partial<AdminOptionsQueryMap[R]> | undefined>).value ?? {};
  }
  return query;
}

function resolveConfigValueKey(
  valueKey: OptionValueKey | Ref<OptionValueKey> | undefined
): OptionValueKey {
  if (!valueKey) {
    return 'value';
  }
  if (typeof valueKey === 'object' && 'value' in valueKey) {
    return valueKey.value ?? 'value';
  }
  return valueKey;
}

export function useAdminRemoteOptions<R extends AdminOptionResource>(
  resource: R,
  config: UseAdminRemoteOptionsConfig<R> = {}
) {
  const store = useAdminOptionStore();
  const options = ref<UiOptionItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const loadFailed = ref(false);
  const initialLoaded = ref(false);
  const resolvedPresetItems = ref<UiOptionItem[]>([]);

  let fetchSeq = 0;

  function resolvePresetValues(): UiOptionItem[] {
    const raw = config.presetValues;
    const values =
      raw && typeof raw === 'object' && 'value' in raw
        ? (raw as Ref<Array<string | number> | string | number | null | undefined>).value
        : raw;
    return buildPresetOptionsFromValues(
      values as Array<string | number> | string | number | null | undefined
    );
  }

  function resolvePresetItems(): UiOptionItem[] {
    const items = config.presetOptions;
    const resolved =
      items && typeof items === 'object' && 'value' in items && !Array.isArray(items)
        ? ((items as Ref<UiOptionItem[]>).value ?? [])
        : ((items as UiOptionItem[] | undefined) ?? []);
    if (resolved.length > 0) {
      return resolved;
    }
    return resolvePresetValues();
  }

  function syncPresetOptions() {
    resolvedPresetItems.value = resolvePresetItems();
    // preset 覆盖已有 options，保证编辑/分配场景回显 label 不被占位项盖住
    options.value = mergeAdminOptionItems(options.value, resolvedPresetItems.value);
  }

  async function fetchOptions(searchText: string) {
    const seq = ++fetchSeq;
    const params = {
      limit: 50,
      includeDisabled: false,
      ...resolveConfigQuery(config.query),
      search: searchText.trim() || undefined
    } as AdminOptionsQueryMap[R];

    loading.value = true;
    loadFailed.value = false;

    try {
      const result = await fetchAdminOptions(resource, params, store);
      if (seq !== fetchSeq) {
        return;
      }

      if (result.failed) {
        loadFailed.value = true;
        if (options.value.length === 0) {
          options.value = mergeAdminOptionItems([], resolvedPresetItems.value);
          total.value = 0;
        }
        return;
      }

      const uiItems = mapOptionsToUi(result.data, resolveConfigValueKey(config.valueKey));
      // 远程 API 覆盖 preset 同 value 项（/options 返回的 label 为权威来源）
      options.value = mergeAdminOptionItems(resolvedPresetItems.value, uiItems);
      total.value = result.data.total;
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
    syncPresetOptions();
    return fetchOptions('');
  }

  function reset() {
    fetchSeq += 1;
    options.value = [];
    total.value = 0;
    loadFailed.value = false;
    initialLoaded.value = false;
    syncPresetOptions();
  }

  if (
    config.presetValues &&
    typeof config.presetValues === 'object' &&
    'value' in config.presetValues
  ) {
    watch(
      config.presetValues as Ref<Array<string | number> | string | number | null | undefined>,
      () => syncPresetOptions(),
      { deep: true }
    );
  }

  if (
    config.presetOptions &&
    typeof config.presetOptions === 'object' &&
    'value' in config.presetOptions
  ) {
    watch(config.presetOptions as Ref<UiOptionItem[] | undefined>, () => syncPresetOptions(), {
      deep: true
    });
  }

  syncPresetOptions();

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
