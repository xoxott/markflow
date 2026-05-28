import { computed, defineComponent, getCurrentInstance } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import { mockAgentApi } from '@/service/api/agent-mock';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { useDialog } from '@/components/base-dialog/useDialog';
import { $t } from '@/locales';
import {
  AGENT_LIST_SCROLL_X,
  createAgentSearchFields,
  createAgentTableColumns
} from './listUiConfig';

const {
  fetchAgentList,
  fetchDeleteAgent,
  fetchPublishAgent,
  fetchDisableAgent,
  fetchCopyAgent,
  fetchExportAgent,
  fetchReloadRegistry
} = mockAgentApi;

type Agent = Api.AgentManagement.AgentTemplateListItem;

export default defineComponent({
  name: 'AgentManagement',
  setup() {
    const message = useMessage();
    const router = useRouter();
    const instance = getCurrentInstance();
    const dialog = useDialog(instance?.appContext.app);

    const { data, loading, pagination, getData, searchParams, onSearch, onReset } =
      useAdminListTable({
        apiFn: fetchAgentList as NaiveUI.TableApiFn,
        listFilters: {
          search: '',
          source: undefined as Api.AgentManagement.AgentSource | undefined,
          status: undefined as Api.AgentManagement.AgentStatus | undefined
        },
        showTotal: true,
        immediate: true
      });

    function handleAdd() {
      router.push('/agent-management/editor/new');
    }

    function handleEdit(row: Agent) {
      router.push(`/agent-management/editor/${row.id}`);
    }

    async function handleCopy(row: Agent) {
      try {
        const result = await fetchCopyAgent(row.id);
        message.success('复制成功');
        router.push(`/agent-management/editor/${result.data.agent.id}`);
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : '复制失败');
      }
    }

    async function handlePublish(row: Agent) {
      await dialog.confirm({
        title: '确认发布',
        content: `确定发布智能体 "${row.name}" 吗？`,
        type: 'warning',
        onConfirm: async () => {
          try {
            await fetchPublishAgent(row.id);
            message.success('发布成功');
            getData();
          } catch (error: unknown) {
            message.error(error instanceof Error ? error.message : '发布失败');
          }
        }
      });
    }

    async function handleDisable(row: Agent) {
      try {
        await fetchDisableAgent(row.id);
        message.success('已停用');
        getData();
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : '操作失败');
      }
    }

    async function handleExport(row: Agent, format: 'md' | 'json') {
      try {
        const result = await fetchExportAgent(row.id, format);
        const blob = new Blob([result.data.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.data.filename;
        a.click();
        URL.revokeObjectURL(url);
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : '导出失败');
      }
    }

    async function handleDelete(row: Agent) {
      await dialog.confirmDelete(row.name, async () => {
        try {
          await fetchDeleteAgent(row.id);
          message.success($t('common.deleteSuccess'));
          getData();
        } catch (error: unknown) {
          message.error(error instanceof Error ? error.message : '删除失败');
        }
      });
    }

    async function handleReloadRegistry() {
      try {
        const result = await fetchReloadRegistry();
        message.success(
          `Registry 已重载：${result.data.subagentCount} 个子代理，${result.data.coordinatorCount} 个协调器`
        );
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : '重载失败');
      }
    }

    const searchConfig = computed(() => createAgentSearchFields());
    const tableColumns = computed(() =>
      createAgentTableColumns({
        onEdit: handleEdit,
        onCopy: handleCopy,
        onPublish: handlePublish,
        onDisable: handleDisable,
        onExport: handleExport,
        onDelete: handleDelete
      })
    );

    return () => (
      <TablePage
        class="h-full"
        searchConfig={searchConfig.value}
        searchModel={searchParams}
        onSearch={onSearch}
        onReset={onReset}
        actionConfig={{
          preset: {
            add: { label: $t('page.agentManagement.add'), onClick: handleAdd },
            refresh: { onClick: getData }
          },
          custom: [
            {
              label: $t('page.agentManagement.reloadRegistry'),
              icon: 'i-mdi-reload',
              onClick: handleReloadRegistry
            }
          ]
        }}
        columns={tableColumns.value}
        data={data.value}
        loading={loading.value}
        pagination={pagination}
        rowKey="id"
        scrollX={AGENT_LIST_SCROLL_X}
        searchLabelWidth={96}
        searchCardBordered={false}
        actionCardBordered={false}
      />
    );
  }
});
