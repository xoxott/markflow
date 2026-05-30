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
  /** 已选值的回显选项（含 label）；传服务端 detail 已知实体，不随当前 bind value 变化 */
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
        ? ((items as Ref<UiOptionItem[] | undefined>).value ?? [])
        : ((items as UiOptionItem[] | undefined) ?? []);
    if (resolved.length > 0) {
      return resolved;
    }
    // presetOptions 显式传 [] 时不回退 presetValues；远程失败时 tag 可能暂显示 ID
    return resolvePresetValues();
  }

  /** 调用方显式传入 presetOptions（含空数组）；undefined 表示未提供，回退 presetValues sync */
  function isExplicitPresetOptions(): boolean {
    if (!config.presetOptions) {
      return false;
    }
    if (
      typeof config.presetOptions === 'object' &&
      'value' in config.presetOptions &&
      !Array.isArray(config.presetOptions)
    ) {
      return (config.presetOptions as Ref<UiOptionItem[] | undefined>).value !== undefined;
    }
    return true;
  }

  function syncPresetOptions() {
    resolvedPresetItems.value = resolvePresetItems();
    // initialLoaded=false：远程未返回，preset 覆盖 ID 占位，保证打开即回显
    // initialLoaded=true：远程已写入 options，保留远程 label，避免选中后回退为 ID
    options.value = initialLoaded.value
      ? mergeAdminOptionItems(resolvedPresetItems.value, options.value)
      : mergeAdminOptionItems(options.value, resolvedPresetItems.value);
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

  const explicitPresetOptions = isExplicitPresetOptions();

  // 未显式传 presetOptions 时监听 presetValues，供列表筛选等仅 bind value 的场景做初始占位
  if (
    config.presetValues &&
    typeof config.presetValues === 'object' &&
    'value' in config.presetValues &&
    !explicitPresetOptions
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
    'value' in config.presetOptions &&
    explicitPresetOptions
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
