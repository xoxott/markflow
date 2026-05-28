/** 订阅 Agent Run 事件 — P4 桥接 ai-server daemon SSE 的占位实现 */

import { onBeforeUnmount, onMounted, ref } from 'vue';
import { subscribeRunEvents } from '@/service/agent/agentRegistryBridge';

export function useAgentRunEvents(runId?: string) {
  const events = ref<Api.AgentManagement.AgentRunEvent[]>([]);
  const connected = ref(true);

  let unsubscribe: (() => void) | undefined;

  onMounted(() => {
    unsubscribe = subscribeRunEvents(event => {
      if (runId && event.runId !== runId) return;
      events.value = [...events.value, event];
    });
  });

  onBeforeUnmount(() => {
    unsubscribe?.();
  });

  return { events, connected };
}

/** 运行时 Registry 元信息 */
export function useAgentRegistryMeta() {
  const meta = ref<{ subagentCount: number; coordinatorCount: number; reloadedAt: string | null }>({
    subagentCount: 0,
    coordinatorCount: 0,
    reloadedAt: null
  });

  onMounted(async () => {
    const { getRegistryReloadMeta } = await import('@/service/agent/agentRegistryBridge');
    meta.value = getRegistryReloadMeta();
  });

  return { meta };
}
