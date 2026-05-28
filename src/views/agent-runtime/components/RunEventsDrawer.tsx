import { type PropType, defineComponent } from 'vue';

type AgentRunEvent = Api.AgentManagement.AgentRunEvent;

export default defineComponent({
  name: 'RunEventsDrawer',
  props: {
    events: {
      type: Array as PropType<AgentRunEvent[]>,
      required: true
    }
  },
  setup(props) {
    return () => (
      <div class="space-y-2">
        {props.events.map(e => (
          <div key={e.seq} class="border rounded p-2 text-xs">
            <div class="mb-1 flex justify-between text-gray-500">
              <span>
                #{e.seq} {e.type}
              </span>
              <span>{new Date(e.timestamp).toLocaleTimeString('zh-CN')}</span>
            </div>
            <pre class="whitespace-pre-wrap">{JSON.stringify(e.payload, null, 2)}</pre>
          </div>
        ))}
        {!props.events.length && <div class="text-sm text-gray-500">暂无事件</div>}
      </div>
    );
  }
});
