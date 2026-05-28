import { type PropType, defineComponent, onMounted, ref } from 'vue';
import { NSelect } from 'naive-ui';
import { mockAgentApi } from '@/service/api/agent-mock';

/** 工作流 AI 节点 / 团队编排共用的已发布模板选择器 */
export default defineComponent({
  name: 'AgentTemplateSelect',
  props: {
    value: { type: String as PropType<string | undefined>, default: undefined },
    disabled: { type: Boolean, default: false },
    publishedOnly: { type: Boolean, default: true },
    onUpdateValue: {
      type: Function as PropType<
        (v: string | undefined, template?: Api.AgentManagement.AgentTemplateListItem) => void
      >,
      default: undefined
    }
  },
  setup(props) {
    const options = ref<
      Array<{ label: string; value: string; template: Api.AgentManagement.AgentTemplateListItem }>
    >([]);
    const loading = ref(false);

    async function load() {
      loading.value = true;
      try {
        const result = props.publishedOnly
          ? await mockAgentApi.fetchPublishedAgents()
          : await mockAgentApi.fetchAgentList({ page: 1, limit: 100 });
        const list: Api.AgentManagement.AgentTemplateListItem[] = props.publishedOnly
          ? result.data
          : result.data.lists;
        options.value = list.map((t: Api.AgentManagement.AgentTemplateListItem) => ({
          label: `${t.name} (${t.agentType})`,
          value: t.id,
          template: t
        }));
      } finally {
        loading.value = false;
      }
    }

    onMounted(load);

    return () => (
      <NSelect
        value={props.value ?? null}
        options={options.value}
        loading={loading.value}
        disabled={props.disabled}
        filterable
        clearable
        placeholder="选择智能体模板"
        onUpdateValue={(v: string | null) => {
          const item = options.value.find(o => o.value === v);
          props.onUpdateValue?.(v ?? undefined, item?.template);
        }}
      />
    );
  }
});
