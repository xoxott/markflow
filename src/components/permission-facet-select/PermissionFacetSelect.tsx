import type { PropType } from 'vue';
import { computed, defineComponent, onMounted, toRef, watch } from 'vue';
import { NSelect } from 'naive-ui';
import type { SelectOption } from 'naive-ui';
import type { PermissionFacetKind } from '@/store/modules/admin-option/cacheKey';
import { usePermissionFacetOptions } from '@/hooks/admin/usePermissionFacetOptions';
import { $t } from '@/locales';

type SelectValue = string | null;

export default defineComponent({
  name: 'PermissionFacetSelect',
  props: {
    facet: {
      type: String as PropType<PermissionFacetKind>,
      required: true
    },
    value: {
      type: String as PropType<SelectValue>,
      default: null
    },
    /** actions 维度：所属 resource */
    resource: {
      type: String as PropType<string | null | undefined>,
      default: undefined
    },
    placeholder: {
      type: String,
      default: ''
    },
    clearable: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    /** 允许输入新 resource/action 字符串 */
    tag: {
      type: Boolean,
      default: true
    },
    limit: {
      type: Number,
      default: 50
    },
    style: {
      type: [String, Object] as PropType<string | Record<string, string>>,
      default: undefined
    },
    class: {
      type: String,
      default: undefined
    }
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    const resourceRef = toRef(props, 'resource');

    const remote = usePermissionFacetOptions(props.facet, {
      resource: resourceRef,
      limit: props.limit
    });

    const actionDisabled = computed(
      () => props.disabled || (props.facet === 'actions' && !props.resource)
    );

    const selectOptions = computed<SelectOption[]>(() =>
      remote.options.value.map(item => ({
        label: item.label,
        value: String(item.value)
      }))
    );

    const remainingCount = computed(() => {
      const diff = remote.total.value - remote.options.value.length;
      return diff > 0 ? diff : 0;
    });

    function handleMenuShow(show: boolean) {
      if (!show || remote.loading.value || actionDisabled.value) {
        return;
      }
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
      () => props.facet,
      () => {
        remote.reset();
        remote.loadInitial().catch(() => undefined);
      }
    );

    onMounted(() => {
      if (props.facet === 'resources' || props.resource) {
        remote.loadInitial().catch(() => undefined);
      }
    });

    return () => (
      <div style={props.style} class={props.class ?? 'w-full'}>
        <NSelect
          value={props.value}
          options={selectOptions.value}
          placeholder={props.placeholder}
          clearable={props.clearable}
          disabled={actionDisabled.value}
          loading={remote.loading.value}
          filterable
          remote
          tag={props.tag}
          style={{ width: '100%' }}
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
