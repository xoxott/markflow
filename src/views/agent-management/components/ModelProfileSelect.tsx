import { type PropType, defineComponent, onMounted, ref } from 'vue';
import { NSelect } from 'naive-ui';
import { mockModelProfileApi } from '@/service/api/model-profile-mock';

function useModelProfileOptions() {
  const options = ref<Array<{ label: string; value: string }>>([]);
  const loading = ref(false);

  async function load() {
    loading.value = true;
    try {
      const result = await mockModelProfileApi.fetchModelProfileList({ page: 1, limit: 100 });
      options.value = result.data.lists
        .filter(p => p.enabled)
        .map(p => ({
          label: `${p.name} (${p.provider}/${p.modelId})`,
          value: p.id
        }));
    } finally {
      loading.value = false;
    }
  }

  onMounted(load);

  return { options, loading, reload: load };
}

export default defineComponent({
  name: 'ModelProfileSelect',
  props: {
    value: { type: String as PropType<string | undefined>, default: undefined },
    disabled: { type: Boolean, default: false },
    onUpdateValue: {
      type: Function as PropType<(v: string | undefined) => void>,
      default: undefined
    }
  },
  setup(props) {
    const { options, loading } = useModelProfileOptions();

    return () => (
      <NSelect
        value={props.value ?? null}
        options={[{ label: 'inherit（继承父模型）', value: '__inherit__' }, ...options.value]}
        loading={loading.value}
        disabled={props.disabled}
        clearable
        placeholder="选择模型配置"
        onUpdateValue={(v: string | null) => {
          if (!v || v === '__inherit__') {
            props.onUpdateValue?.(undefined);
          } else {
            props.onUpdateValue?.(v);
          }
        }}
      />
    );
  }
});
