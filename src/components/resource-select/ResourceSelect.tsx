import { computed, defineComponent, ref, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { NSelect } from 'naive-ui';
import type { SelectOption } from 'naive-ui';
import { fetchResourceList } from '@/service/api/resource';

export default defineComponent({
  name: 'ResourceSelect',
  props: {
    value: { type: Number as () => number | null, default: null },
    disabled: { type: Boolean, default: false },
    placeholder: { type: String, default: '' }
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    const options = ref<SelectOption[]>([]);
    const loading = ref(false);

    const loadOptions = useDebounceFn(async (search = '') => {
      loading.value = true;
      try {
        const { data } = await fetchResourceList({
          search: search || undefined,
          limit: 50,
          page: 1,
          isActive: 'true'
        });
        const items =
          data && typeof data === 'object' && 'items' in data
            ? (data as Api.ResourceManagement.ResourceListResponse).items
            : [];
        options.value = items.map((item: Api.ResourceManagement.Resource) => ({
          label: `${item.name} (${item.code})`,
          value: item.id
        }));
      } finally {
        loading.value = false;
      }
    }, 300);

    watch(
      () => props.value,
      () => {
        if (options.value.length === 0) {
          loadOptions('');
        }
      },
      { immediate: true }
    );

    const resolvedPlaceholder = computed(() => props.placeholder);

    return () => (
      <NSelect
        value={props.value}
        options={options.value}
        placeholder={resolvedPlaceholder.value}
        disabled={props.disabled}
        loading={loading.value}
        filterable
        remote
        clearable
        onSearch={loadOptions}
        onUpdateShow={show => {
          if (show) loadOptions('');
        }}
        onUpdateValue={value => emit('update:value', (value as number | null) ?? null)}
      />
    );
  }
});
