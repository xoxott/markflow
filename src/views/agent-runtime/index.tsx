import { computed, defineComponent, getCurrentInstance, ref } from 'vue';
import {
  NButton,
  NDrawer,
  NDrawerContent,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
  useMessage
} from 'naive-ui';
import { mockAgentRunApi } from '@/service/api/agent-run-mock';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { useDialog } from '@/components/base-dialog/useDialog';
import type { SearchFieldConfig, TableColumnConfig } from '@/components/table-page/types';

const {
  fetchAgentSessionList,
  fetchAgentRunList,
  fetchAgentRunEvents,
  fetchStopAgentSession,
  fetchUpdateAgentSession
} = mockAgentRunApi;

type Session = Api.AgentManagement.AgentSession;
type Run = Api.AgentManagement.AgentRun;

const RUN_STATUS_TYPE: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'default',
  running: 'info',
  completed: 'success',
  failed: 'error',
  stopped: 'warning'
};

export default defineComponent({
  name: 'AgentRuntime',
  setup() {
    const message = useMessage();
    const instance = getCurrentInstance();
    const dialog = useDialog(instance?.appContext.app);

    const activeTab = ref('sessions');
    const eventsVisible = ref(false);
    const events = ref<Api.AgentManagement.AgentRunEvent[]>([]);
    const selectedRun = ref<Run | null>(null);
    const sessionFilter = ref('');

    const sessionsTable = useAdminListTable({
      apiFn: fetchAgentSessionList as NaiveUI.TableApiFn,
      listFilters: { search: '', status: undefined },
      showTotal: true,
      immediate: true
    });

    const runsTable = useAdminListTable({
      apiFn: fetchAgentRunList as NaiveUI.TableApiFn,
      listFilters: {
        search: '',
        sessionId: undefined as string | undefined,
        agentType: undefined as string | undefined,
        status: undefined as Api.AgentManagement.RunStatus | undefined
      },
      showTotal: true,
      immediate: false
    });

    const sessionSearchFields: SearchFieldConfig[] = [
      {
        type: 'input',
        field: 'search',
        label: '搜索',
        placeholder: '标题 / Session ID',
        width: '200px'
      },
      {
        type: 'select',
        field: 'status',
        label: '状态',
        placeholder: '全部',
        width: '120px',
        options: [
          { label: 'active', value: 'active' },
          { label: 'paused', value: 'paused' },
          { label: 'completed', value: 'completed' },
          { label: 'destroyed', value: 'destroyed' }
        ]
      }
    ];

    const runSearchFields = computed<SearchFieldConfig[]>(() => [
      {
        type: 'input',
        field: 'search',
        label: '搜索',
        placeholder: '任务 / agentType',
        width: '200px'
      },
      {
        type: 'input',
        field: 'sessionId',
        label: 'Session',
        placeholder: sessionFilter.value || 'sessionId',
        width: '180px'
      },
      {
        type: 'select',
        field: 'status',
        label: '状态',
        placeholder: '全部',
        width: '120px',
        options: [
          { label: 'pending', value: 'pending' },
          { label: 'running', value: 'running' },
          { label: 'completed', value: 'completed' },
          { label: 'failed', value: 'failed' },
          { label: 'stopped', value: 'stopped' }
        ]
      }
    ]);

    async function handleViewRuns(session: Session) {
      sessionFilter.value = session.sessionId;
      (runsTable.searchParams as Api.AgentManagement.AgentRunListParams).sessionId =
        session.sessionId;
      activeTab.value = 'runs';
      runsTable.getData();
    }

    async function handleStopSession(session: Session) {
      await dialog.confirm({
        title: '停止会话',
        content: `确定停止会话 "${session.title ?? session.sessionId}" 吗？`,
        type: 'warning',
        onConfirm: async () => {
          await fetchStopAgentSession(session.sessionId);
          message.success('会话已停止');
          sessionsTable.getData();
        }
      });
    }

    async function handleRenameSession(session: Session) {
      const title = window.prompt('新标题', session.title ?? '');
      if (title === null) return;
      await fetchUpdateAgentSession(session.sessionId, { title });
      message.success('已更新');
      sessionsTable.getData();
    }

    async function handleViewEvents(run: Run) {
      selectedRun.value = run;
      const result = await fetchAgentRunEvents(run.runId);
      events.value = result.data;
      eventsVisible.value = true;
    }

    const sessionColumns: TableColumnConfig<Session>[] = [
      { title: 'Session ID', key: 'sessionId', width: 180 },
      { title: '标题', key: 'title', width: 160, render: (r: Session) => r.title ?? '-' },
      { title: '标签', key: 'tag', width: 100, render: (r: Session) => r.tag ?? '-' },
      { title: '状态', key: 'status', width: 100 },
      { title: '轮次', key: 'turnCount', width: 70 },
      {
        title: '费用 (USD)',
        key: 'accumulatedCostUsd',
        width: 100,
        render: (r: Session) =>
          r.accumulatedCostUsd !== null && r.accumulatedCostUsd !== undefined
            ? `$${r.accumulatedCostUsd}`
            : '-'
      },
      {
        title: '最后活跃',
        key: 'lastActiveAt',
        width: 170,
        render: (r: Session) => new Date(r.lastActiveAt).toLocaleString('zh-CN')
      },
      {
        title: '操作',
        key: 'action',
        width: 240,
        fixed: 'right',
        render: (row: Session) => (
          <NSpace size="small">
            <NButton size="small" onClick={() => handleViewRuns(row)}>
              查看 Runs
            </NButton>
            <NButton size="small" onClick={() => handleRenameSession(row)}>
              重命名
            </NButton>
            <NButton size="small" type="warning" onClick={() => handleStopSession(row)}>
              停止
            </NButton>
          </NSpace>
        )
      }
    ];

    const runColumns: TableColumnConfig<Run>[] = [
      { title: 'Run ID', key: 'runId', width: 140 },
      { title: 'Agent', key: 'agentType', width: 140 },
      { title: '阶段', key: 'phase', width: 120, render: (r: Run) => r.phase ?? '-' },
      { title: '任务', key: 'task', width: 200 },
      {
        title: '状态',
        key: 'status',
        width: 100,
        render: (row: Run) => (
          <NTag size="small" type={RUN_STATUS_TYPE[row.status] ?? 'default'} bordered={false}>
            {row.status}
          </NTag>
        )
      },
      {
        title: '耗时',
        key: 'durationMs',
        width: 90,
        render: (r: Run) =>
          r.durationMs !== null && r.durationMs !== undefined
            ? `${Math.round(r.durationMs / 1000)}s`
            : '-'
      },
      {
        title: '操作',
        key: 'action',
        width: 120,
        fixed: 'right',
        render: (row: Run) => (
          <NButton size="small" onClick={() => handleViewEvents(row)}>
            事件流
          </NButton>
        )
      }
    ];

    return () => (
      <div class="h-full flex flex-col p-4">
        <NTabs v-model:value={activeTab.value} type="line" animated>
          <NTabPane name="sessions" tab="Sessions">
            <TablePage
              class="h-full"
              searchConfig={sessionSearchFields}
              searchModel={sessionsTable.searchParams}
              onSearch={sessionsTable.onSearch}
              onReset={sessionsTable.onReset}
              actionConfig={{ preset: { refresh: { onClick: sessionsTable.getData } } }}
              columns={sessionColumns}
              data={sessionsTable.data.value}
              loading={sessionsTable.loading.value}
              pagination={sessionsTable.pagination}
              rowKey="sessionId"
              scrollX={1200}
              searchCardBordered={false}
              actionCardBordered={false}
            />
          </NTabPane>
          <NTabPane
            name="runs"
            tab="Runs"
            onVnodeMounted={() => {
              if (!runsTable.data.value.length) runsTable.getData();
            }}
          >
            <TablePage
              class="h-full"
              searchConfig={runSearchFields.value}
              searchModel={runsTable.searchParams}
              onSearch={runsTable.onSearch}
              onReset={runsTable.onReset}
              actionConfig={{ preset: { refresh: { onClick: runsTable.getData } } }}
              columns={runColumns}
              data={runsTable.data.value}
              loading={runsTable.loading.value}
              pagination={runsTable.pagination}
              rowKey="runId"
              scrollX={1100}
              searchCardBordered={false}
              actionCardBordered={false}
            />
          </NTabPane>
        </NTabs>

        <NDrawer
          show={eventsVisible.value}
          width={520}
          onUpdateShow={(v: boolean) => (eventsVisible.value = v)}
        >
          <NDrawerContent title={`Run 事件 — ${selectedRun.value?.runId ?? ''}`}>
            <div class="space-y-2">
              {events.value.map(e => (
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
              {!events.value.length && <div class="text-sm text-gray-500">暂无事件</div>}
            </div>
          </NDrawerContent>
        </NDrawer>
      </div>
    );
  }
});
