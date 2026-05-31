import { computed, defineComponent, getCurrentInstance, ref } from 'vue';
import { useMessage } from 'naive-ui';
import {
  fetchAcknowledgeAlert,
  fetchAlertDetail,
  fetchAlertList,
  fetchBatchDeleteAlerts,
  fetchCreateAlert,
  fetchDeleteAlert,
  fetchResolveAlert,
  fetchUpdateAlert
} from '@/service/api/alert';
import { useAuthStore } from '@/store/modules/auth';
import { hasPermissionAccess } from '@/utils/rbac/permission-access';
import { $t } from '@/locales';
import { useDialog } from '@/components/base-dialog/useDialog';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { useAlertDialog } from './components/useAlertDialog';
import {
  ALERT_LIST_SCROLL_X,
  createAlertSearchFields,
  createAlertTableColumns
} from './listUiConfig';
import { buildWritePayload, createEmptyForm } from './utils/alert-form';

type Alert = Api.AlertManagement.Alert;

export default defineComponent({
  name: 'AlertManagement',
  setup() {
    const message = useMessage();
    const instance = getCurrentInstance();
    const alertDialog = useAlertDialog();
    const dialog = useDialog(instance?.appContext.app);
    const authStore = useAuthStore();

    const canWrite = computed(() =>
      hasPermissionAccess(authStore.permissionCodes, ['alert:write'])
    );
    const canDelete = computed(() =>
      hasPermissionAccess(authStore.permissionCodes, ['alert:delete'])
    );

    const selectedRowKeys = ref<number[]>([]);

    const { data, loading, pagination, getData, searchParams, onSearch, onReset } =
      useAdminListTable({
        apiFn: fetchAlertList,
        listFilters: {
          search: '',
          type: undefined as Api.AlertManagement.AlertType | undefined,
          level: undefined as Api.AlertManagement.AlertLevel | undefined,
          status: undefined as Api.AlertManagement.AlertStatus | undefined,
          sortBy: undefined as string | undefined,
          sortOrder: undefined as 'ASC' | 'DESC' | undefined
        },
        showTotal: true,
        immediate: true
      });

    async function handleAdd() {
      if (!canWrite.value) return;

      await alertDialog.showAlertForm({
        isEdit: false,
        formData: createEmptyForm(),
        onConfirm: async form => {
          await fetchCreateAlert(buildWritePayload(form));
          message.success($t('common.addSuccess'));
          getData();
        }
      });
    }

    async function handleEdit(row: Alert) {
      if (!canWrite.value || row.status === 'resolved') return;

      const { data: alertDetail, error } = await fetchAlertDetail(row.id);
      if (error || !alertDetail) {
        message.error($t('page.alertManagement.getDetailFailed'));
        return;
      }

      await alertDialog.showAlertForm({
        isEdit: true,
        formData: {
          type: alertDetail.type,
          level: alertDetail.level,
          title: alertDetail.title,
          message: alertDetail.message,
          source: alertDetail.source || ''
        },
        onConfirm: async form => {
          await fetchUpdateAlert(row.id, buildWritePayload(form));
          message.success($t('common.updateSuccess'));
          getData();
        }
      });
    }

    async function handleAcknowledge(row: Alert) {
      if (!canWrite.value) return;

      await fetchAcknowledgeAlert(row.id);
      message.success($t('page.alertManagement.acknowledgeSuccess'));
      getData();
    }

    async function handleResolve(row: Alert) {
      if (!canWrite.value) return;

      await fetchResolveAlert(row.id);
      message.success($t('page.alertManagement.resolveSuccess'));
      getData();
    }

    async function handleDelete(row: Alert) {
      if (!canDelete.value) return;

      await dialog.confirmDelete(row.title, async () => {
        await fetchDeleteAlert(row.id);
        message.success($t('common.deleteSuccess'));
        getData();
      });
    }

    async function handleBatchDelete() {
      if (!canDelete.value) return;

      if (selectedRowKeys.value.length === 0) {
        message.warning($t('page.alertManagement.selectAlertsToDelete'));
        return;
      }
      await dialog.confirmDelete(
        $t('page.alertManagement.confirmBatchDelete', {
          count: selectedRowKeys.value.length
        }),
        async () => {
          const { data: result, error } = await fetchBatchDeleteAlerts({
            ids: selectedRowKeys.value
          });
          if (error) {
            return;
          }

          const failedCount = result?.failedIds?.length ?? 0;
          const deletedCount = result?.deletedCount ?? 0;

          if (failedCount > 0) {
            message.warning(
              $t('page.alertManagement.batchDeletePartialSuccess', {
                deleted: deletedCount,
                failed: failedCount
              })
            );
          } else {
            message.success($t('page.alertManagement.batchDeleteSuccess'));
          }

          selectedRowKeys.value = [];
          getData();
        }
      );
    }

    const searchConfig = computed(() => createAlertSearchFields());

    const tableColumns = computed(() =>
      createAlertTableColumns({
        canWrite: canWrite.value,
        canDelete: canDelete.value,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onAcknowledge: handleAcknowledge,
        onResolve: handleResolve
      })
    );

    return () => (
      <TablePage
        class="h-full"
        enableColumnSetting={true}
        searchConfig={searchConfig.value}
        searchModel={searchParams}
        onSearch={onSearch}
        onReset={onReset}
        actionConfig={{
          preset: {
            add: canWrite.value ? { onClick: handleAdd } : undefined,
            batchDelete: canDelete.value ? { onClick: handleBatchDelete } : undefined,
            refresh: { onClick: getData }
          }
        }}
        columns={tableColumns.value}
        data={data.value}
        loading={loading.value}
        pagination={pagination}
        selectedKeys={canDelete.value ? selectedRowKeys.value : []}
        onUpdateSelectedKeys={keys => {
          if (canDelete.value) {
            selectedRowKeys.value = keys as number[];
          }
        }}
        rowKey="id"
        scrollX={ALERT_LIST_SCROLL_X}
        searchCardBordered={false}
        actionCardBordered={false}
      />
    );
  }
});
