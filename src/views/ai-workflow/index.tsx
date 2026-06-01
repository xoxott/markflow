import { computed, defineComponent, getCurrentInstance, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import {
  fetchArchiveWorkflow,
  fetchCreateWorkflow,
  fetchDeleteWorkflow,
  fetchExecuteWorkflow,
  fetchPublishWorkflow,
  fetchWorkflowList
} from '@/service/api/workflow';
import { useDialog } from '@/components/base-dialog/useDialog';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { $t } from '@/locales';
import type { WorkflowFormData } from './components/dialogs/dialog';
import { useWorkflowDialog } from './components';
import {
  WORKFLOW_LIST_SCROLL_X,
  createWorkflowSearchFields,
  createWorkflowTableColumns
} from './listUiConfig';

type Workflow = Api.Workflow.Workflow;

export default defineComponent({
  name: 'AIWorkflow',
  setup() {
    const message = useMessage();
    const router = useRouter();
    const instance = getCurrentInstance();
    const dialog = useDialog(instance?.appContext.app);
    const workflowDialog = useWorkflowDialog();

    const selectedRowKeys = ref<number[]>([]);

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
            if (!result.data) {
              throw new Error('创建工作流失败');
            }
            message.success($t('common.addSuccess'));
            router.push(`/ai-workflow/editor/${result.data.id}`);
          } catch (error: any) {
            message.error(error?.message || '操作失败');
            throw error;
          }
        }
      });
    }

    function handleEdit(row: Workflow) {
      router.push(`/ai-workflow/editor/${row.id}`);
    }

    async function handleExecute(row: Workflow) {
      try {
        const result = await fetchExecuteWorkflow(row.id);
        if (!result.data) {
          throw new Error('执行失败');
        }
        message.success('工作流已开始执行');
        workflowDialog.showExecutionDetail({
          executionId: result.data.id
        });
        getData();
      } catch (error: any) {
        message.error(error?.message || '执行失败');
      }
    }

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

    const searchConfig = computed(() => createWorkflowSearchFields());

    const tableColumns = computed(() =>
      createWorkflowTableColumns({
        onEdit: handleEdit,
        onExecute: handleExecute,
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
            refresh: { onClick: getData }
          }
        }}
        columns={tableColumns.value}
        data={data.value}
        loading={loading.value}
        pagination={pagination}
        selectedKeys={selectedRowKeys.value}
        onUpdateSelectedKeys={keys => {
          selectedRowKeys.value = keys as number[];
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
