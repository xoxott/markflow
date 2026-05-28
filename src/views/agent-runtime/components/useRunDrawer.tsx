import { mockAgentRunApi } from '@/service/api/agent-run-mock';
import useDrawer from '@/components/base-drawer/useDrawer';
import RunEventsDrawer from './RunEventsDrawer';

type Run = Api.AgentManagement.AgentRun;

function releaseFocus() {
  (document.activeElement as HTMLElement | null)?.blur?.();
}

export function useRunDrawer() {
  const drawer = useDrawer();

  const showRunEvents = async (run: Run) => {
    releaseFocus();
    const result = await mockAgentRunApi.fetchAgentRunEvents(run.runId);

    return drawer.open({
      title: `Run 事件 — ${run.runId}`,
      content: () => <RunEventsDrawer events={result.data} />,
      width: 520,
      placement: 'right',
      closable: true,
      trapFocus: true,
      autoFocus: true
    });
  };

  return { showRunEvents };
}

export type UseRunDrawerReturn = ReturnType<typeof useRunDrawer>;
