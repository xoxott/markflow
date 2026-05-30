import type { PropType } from 'vue';
import { computed, defineComponent, onMounted, toRef, watch } from 'vue';
import { NSelect } from 'naive-ui';
import type { SelectOption } from 'naive-ui';
import { SELECT_MENU_OVER_DIALOG_Z_INDEX } from '@/constants/overlay-z-index';
import { useAdminRemoteOptions } from '@/hooks/admin/useAdminRemoteOptions';
import type { AdminOptionResource, OptionValueKey, UiOptionItem } from '@/hooks/admin/types';
import { $t } from '@/locales';
import type { AdminRemoteSelectQuery } from './types';

type SelectValue = string | number | Array<string | number> | null;

export default defineComponent({
  name: 'AdminRemoteSelect',
  props: {
    value: {
      type: [String, Number, Array] as PropType<SelectValue>,
      default: null
    },
    resource: {
      type: String as PropType<AdminOptionResource>,
      required: true
    },
    /** 透传 ai-server options API 查询参数（与各 resource 的 *OptionsQuery 一致） */
    query: {
      type: Object as PropType<AdminRemoteSelectQuery>,
      default: () => ({})
    },
    placeholder: {
      type: String,
      default: ''
    },
    multiple: {
      type: Boolean,
      default: false
    },
    clearable: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    includeDisabled: {
      type: Boolean,
      default: false
    },
    limit: {
      type: Number,
      default: 50
    },
    /** UI 绑定字段，默认 value（实体 ID）；仅菜单可见性等鉴权配置可指定 code */
    valueKey: {
      type: String as PropType<OptionValueKey>,
      default: 'value'
    },
    maxTagCount: {
      type: [String, Number] as PropType<number | 'responsive'>,
      default: 'responsive'
    },
    style: {
      type: [String, Object] as PropType<string | Record<string, string>>,
      default: undefined
    },
    excludeValues: {
      type: Array as PropType<Array<string | number>>,
      default: () => []
    },
    /** 已选值的回显选项（含 label）；编辑/分配场景传入已知 label，避免只显示 ID */
    presetOptions: {
      type: Array as PropType<UiOptionItem[]>,
      default: undefined
    },
    class: {
      type: String,
      default: undefined
    }
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    const presetValues = computed(() => props.value);
    const presetOptionsProp = toRef(props, 'presetOptions');

    const apiQuery = computed(() => ({
      limit: props.limit,
      includeDisabled: props.includeDisabled,
      ...props.query
    }));

    const remote = useAdminRemoteOptions(props.resource, {
      query: apiQuery,
      valueKey: toRef(props, 'valueKey'),
      presetValues,
      presetOptions: presetOptionsProp
    });

    const selectOptions = computed<SelectOption[]>(() =>
      remote.options.value
        .filter(item => !props.excludeValues.some(v => String(v) === String(item.value)))
        .map(item => ({
          label: item.label,
          value: item.value,
          disabled: item.disabled
        }))
    );

    const remainingCount = computed(() => {
      const diff = remote.total.value - remote.options.value.length;
      return diff > 0 ? diff : 0;
    });

    function handleMenuShow(show: boolean) {
      if (!show || remote.loading.value) {
        return;
      }
      // 挂载预加载未完成或曾失败时，展开菜单补拉一次（避免 focus/show 重复请求）
      if (!remote.initialLoaded.value || remote.loadFailed.value) {
        remote.loadInitial().catch(() => undefined);
      }
    }

    function handleSearch(query: string) {
      remote.search(query);
    }

    function handleUpdateValue(value: SelectValue) {
      emit('update:value', value);
    }

    watch(
      () => ({
        resource: props.resource,
        limit: props.limit,
        includeDisabled: props.includeDisabled,
        valueKey: props.valueKey,
        query: props.query
      }),
      () => {
        remote.reset();
      },
      { deep: true }
    );

    onMounted(() => {
      remote.loadInitial().catch(() => undefined);
    });

    return () => (
      <div style={props.style} class={props.class ?? 'w-full'}>
        <NSelect
          value={props.value}
          options={selectOptions.value}
          placeholder={props.placeholder}
          multiple={props.multiple}
          clearable={props.clearable}
          disabled={props.disabled}
          loading={remote.loading.value}
          filterable
          remote
          maxTagCount={props.maxTagCount}
          style={{ width: '100%' }}
          menuProps={{ style: { zIndex: SELECT_MENU_OVER_DIALOG_Z_INDEX } }}
          onUpdateShow={handleMenuShow}
          onSearch={handleSearch}
          onUpdateValue={handleUpdateValue}
        />
        {remainingCount.value > 0 ? (
          <div class="mt-4px text-12px text-gray-400">
            {$t('common.adminRemoteSelectMoreResults', { count: remainingCount.value })}
          </div>
        ) : null}
        {remote.loadFailed.value ? (
          <div class="mt-4px text-12px text-red-500">
            {$t('common.adminRemoteSelectLoadFailed')}
          </div>
        ) : null}
      </div>
    );
  }
});
