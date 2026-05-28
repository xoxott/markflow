import { computed, defineComponent, onMounted, ref } from 'vue';
import { NSelect } from 'naive-ui';
import { mockMenuApi } from '@/service/api/menu-mock';

export default defineComponent({
  name: 'RouteKeySelect',
  props: {
    value: { type: String, default: '' },
    disabled: { type: Boolean, default: false }
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    const options = ref<Array<{ label: string; value: string }>>([]);

    onMounted(async () => {
      const result = await mockMenuApi.fetchRouteRegistry();
      options.value = result.data.map(item => ({
        label: `${item.routeKey} (${item.path})`,
        value: item.routeKey
      }));
    });

    const innerValue = computed({
      get: () => props.value || null,
      set: (val: string | null) => emit('update:value', val ?? '')
    });

    return () => (
      <NSelect
        v-model:value={innerValue.value}
        options={options.value}
        filterable
        clearable
        disabled={props.disabled}
        placeholder="选择 RouteKey"
      />
    );
  }
});
