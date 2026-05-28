import { computed, defineComponent, getCurrentInstance, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import { mockWorkflowApi } from '@/service/api/workflow-mock';
import { useDialog } from '@/components/base-dialog/useDialog';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { $t } from '@/locales';
// 暂时使用 Mock 数据，后续替换为真实 API
import type { WorkflowFormData } from './components/dialogs/dialog';
import { useWorkflowDialog } from './components';
import {
  WORKFLOW_LIST_SCROLL_X,
  createWorkflowSearchFields,
  createWorkflowTableColumns
} from './listUiConfig';

const {
  fetchWorkflowList,
  fetchCreateWorkflow,
  fetchDeleteWorkflow,
  fetchBatchDeleteWorkflows,
  fetchCopyWorkflow,
  fetchPublishWorkflow,
  fetchArchiveWorkflow,
  fetchExecuteWorkflow,
  fetchRestoreWorkflowVersion
} = mockWorkflowApi;

type Workflow = Api.Workflow.Workflow;

export default defineComponent({
  name: 'AIWorkflow',
  setup() {
    const message = useMessage();
    const router = useRouter();
    const instance = getCurrentInstance();
    const dialog = useDialog(instance?.appContext.app);
    const workflowDialog = useWorkflowDialog();

    const selectedRowKeys = ref<string[]>([]);

    const { data, loading, pagination, getData, searchParams, onSearch, onReset } =
      useAdminListTable({
        apiFn: fetchWorkflowList,
        listFilters: {
          search: '',
          status: undefined
        },
        showTotal: true,
        immediate: true
      });

    // 新建工作流
    async function handleAdd() {
      const formData: WorkflowFormData = {
        name: '',
        description: '',
        tags: []
      };

      await workflowDialog.showWorkflowForm({
        isEdit: false,
        formData,
        onConfirm: async (confirmData: WorkflowFormData) => {
          try {
            const result = await fetchCreateWorkflow({
              name: confirmData.name,
              description: confirmData.description,
              tags: confirmData.tags
            });
            message.success($t('common.addSuccess'));
            // 跳转到编辑器
            router.push(`/ai-workflow/editor/${result.data.id}`);
          } catch (error: any) {
            message.error(error?.message || '操作失败');
            throw error;
          }
        }
      });
    }

    // 编辑工作流
    async function handleEdit(row: Workflow) {
      // 跳转到编辑器页面
      router.push(`/ai-workflow/editor/${row.id}`);
    }

    // 复制工作流
    async function handleCopy(row: Workflow) {
      try {
        await fetchCopyWorkflow(row.id, `${row.name} (副本)`);
        message.success('复制成功');
        getData();
      } catch (error: any) {
        message.error(error?.message || '复制失败');
      }
    }

    // 执行工作流
    async function handleExecute(row: Workflow) {
      try {
        const result = await fetchExecuteWorkflow(row.id);
        message.success('工作流已开始执行');
        // 显示执行详情
        workflowDialog.showExecutionDetail({
          executionId: result.data.id
        });
        getData();
      } catch (error: any) {
        message.error(error?.message || '执行失败');
      }
    }

    // 版本历史
    function handleVersionHistory(row: Workflow) {
      workflowDialog.showVersionHistory({
        workflowId: row.id,
        onRestore: async (version: number) => {
          await fetchRestoreWorkflowVersion(row.id, version);
          getData();
        }
      });
    }

    // 发布工作流
    async function handlePublish(row: Workflow) {
      await dialog.confirm({
        title: '确认发布',
        content: `确定要发布工作流 "${row.name}" 吗？`,
        confirmText: '确定',
        cancelText: '取消',
        type: 'warning',
        onConfirm: async () => {
          try {
            await fetchPublishWorkflow(row.id);
            message.success('发布成功');
            getData();
          } catch (error: any) {
            message.error(error?.message || '发布失败');
          }
        }
      });
    }

    // 归档工作流
    async function handleArchive(row: Workflow) {
      await dialog.confirm({
        title: '确认归档',
        content: `确定要归档工作流 "${row.name}" 吗？`,
        confirmText: '确定',
        cancelText: '取消',
        type: 'warning',
        onConfirm: async () => {
          try {
            await fetchArchiveWorkflow(row.id);
            message.success('归档成功');
            getData();
          } catch (error: any) {
            message.error(error?.message || '归档失败');
          }
        }
      });
    }

    // 删除工作流
    async function handleDelete(row: Workflow) {
      await dialog.confirmDelete(row.name, async () => {
        try {
          await fetchDeleteWorkflow(row.id);
          message.success($t('common.deleteSuccess'));
          getData();
        } catch (error: any) {
          message.error(error?.message || '操作失败');
        }
      });
    }

    // 批量删除
    async function handleBatchDelete() {
      if (selectedRowKeys.value.length === 0) {
        message.warning('请选择要删除的工作流');
        return;
      }

      await dialog.confirmDelete(`${selectedRowKeys.value.length} 个工作流`, async () => {
        try {
          await fetchBatchDeleteWorkflows({ ids: selectedRowKeys.value });
          message.success($t('common.deleteSuccess'));
          selectedRowKeys.value = [];
          getData();
        } catch (error: any) {
          message.error(error?.message || $t('common.error'));
        }
      });
    }

    const searchConfig = computed(() => createWorkflowSearchFields());

    const tableColumns = computed(() =>
      createWorkflowTableColumns({
        onEdit: handleEdit,
        onCopy: handleCopy,
        onExecute: handleExecute,
        onVersion: handleVersionHistory,
        onPublish: handlePublish,
        onArchive: handleArchive,
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
            add: { label: '新建工作流', onClick: handleAdd },
            batchDelete: { onClick: handleBatchDelete },
            refresh: { onClick: getData }
          }
        }}
        columns={tableColumns.value}
        data={data.value}
        loading={loading.value}
        pagination={pagination}
        selectedKeys={selectedRowKeys.value}
        onUpdateSelectedKeys={keys => {
          selectedRowKeys.value = keys as string[];
        }}
        rowKey="id"
        scrollX={WORKFLOW_LIST_SCROLL_X}
        searchLabelWidth={96}
        searchCardBordered={false}
        actionCardBordered={false}
      />
    );
  }
});
