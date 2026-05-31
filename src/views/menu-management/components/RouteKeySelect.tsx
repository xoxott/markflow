import type { PropType } from 'vue';
import { computed, defineComponent } from 'vue';
import { NSelect } from 'naive-ui';

export default defineComponent({
  name: 'RouteKeySelect',
  props: {
    value: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    options: {
      type: Array as PropType<Array<{ label: string; value: string }>>,
      default: () => []
    }
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    const innerValue = computed({
      get: () => props.value || null,
      set: (val: string | null) => emit('update:value', val ?? '')
    });

    return () => (
      <NSelect
        v-model:value={innerValue.value}
        options={props.options}
        filterable
        clearable
        disabled={props.disabled}
        placeholder="选择 RouteKey"
      />
    );
  }
});
