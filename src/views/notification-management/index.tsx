import { computed, defineComponent, getCurrentInstance, ref } from 'vue';
import { useMessage } from 'naive-ui';
import {
  fetchArchiveNotification,
  fetchBatchDeleteNotifications,
  fetchCreateNotification,
  fetchDeleteNotification,
  fetchNotificationDetail,
  fetchNotificationList,
  fetchPublishNotification,
  fetchRevertNotificationToDraft,
  fetchUpdateNotification
} from '@/service/api/notification';
import { useAuthStore } from '@/store/modules/auth';
import { hasPermissionAccess } from '@/utils/rbac/permission-access';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { $t } from '@/locales';
import { useDialog } from '@/components/base-dialog/useDialog';
import { useNotificationDialog } from './components/useNotificationDialog';
import {
  NOTIFICATION_LIST_SCROLL_X,
  createNotificationSearchFields,
  createNotificationTableColumns
} from './listUiConfig';
import { buildWritePayload, createEmptyForm } from './utils/notification-form';

type Notification = Api.NotificationManagement.Notification;

export default defineComponent({
  name: 'NotificationManagement',
  setup() {
    const message = useMessage();
    const instance = getCurrentInstance();
    const notificationDialog = useNotificationDialog();
    const dialog = useDialog(instance?.appContext.app);
    const authStore = useAuthStore();

    const canWrite = computed(() =>
      hasPermissionAccess(authStore.permissionCodes, ['notification:write'])
    );
    const canDelete = computed(() =>
      hasPermissionAccess(authStore.permissionCodes, ['notification:delete'])
    );

    const selectedRowKeys = ref<number[]>([]);

    const { data, loading, pagination, getData, searchParams, onSearch, onReset } =
      useAdminListTable({
        apiFn: fetchNotificationList,
        listFilters: {
          search: '',
          status: undefined as Api.NotificationManagement.NotificationStatus | undefined,
          type: undefined as Api.NotificationManagement.NotificationType | undefined,
          sortBy: undefined as string | undefined,
          sortOrder: undefined as 'ASC' | 'DESC' | undefined
        },
        showTotal: true,
        immediate: true
      });

    async function handleAdd() {
      if (!canWrite.value) return;

      await notificationDialog.showNotificationForm({
        isEdit: false,
        formData: createEmptyForm(),
        onConfirm: async form => {
          await fetchCreateNotification(buildWritePayload(form));
          message.success($t('common.addSuccess'));
          getData();
        }
      });
    }

    async function handleEdit(row: Notification) {
      if (!canWrite.value || row.status !== 'draft') return;

      const { data: notificationDetail, error } = await fetchNotificationDetail(row.id);
      if (error || !notificationDetail) {
        message.error($t('page.notificationManagement.getDetailFailed'));
        return;
      }

      await notificationDialog.showNotificationForm({
        isEdit: true,
        formData: {
          title: notificationDetail.title,
          content: notificationDetail.content,
          type: notificationDetail.type,
          priority: notificationDetail.priority,
          expiresAt: notificationDetail.expiresAt || '',
          targetUserIds: notificationDetail.targetUserIds || [],
          targetRoleIds: notificationDetail.targetRoleIds || []
        },
        targetUsers: notificationDetail.targetUsers ?? undefined,
        targetRoles: notificationDetail.targetRoles ?? undefined,
        onConfirm: async form => {
          await fetchUpdateNotification(row.id, buildWritePayload(form));
          message.success($t('common.updateSuccess'));
          getData();
        }
      });
    }

    async function confirmPublish(row: Notification, republish: boolean) {
      if (!canWrite.value) return;

      await dialog.confirm({
        title: republish
          ? $t('page.notificationManagement.confirmRepublishTitle')
          : $t('page.notificationManagement.confirmPublishTitle'),
        content: republish
          ? $t('page.notificationManagement.confirmRepublish', { title: row.title })
          : $t('page.notificationManagement.confirmPublish', { title: row.title }),
        type: 'info',
        onConfirm: async () => {
          await fetchPublishNotification(row.id);
          message.success(
            republish
              ? $t('page.notificationManagement.republishSuccess')
              : $t('page.notificationManagement.publishSuccess')
          );
          getData();
        }
      });
    }

    async function confirmRevertToDraft(row: Notification) {
      if (!canWrite.value) return;

      await dialog.confirm({
        title: $t('page.notificationManagement.confirmRevertToDraftTitle'),
        content: $t('page.notificationManagement.confirmRevertToDraft', { title: row.title }),
        type: 'warning',
        onConfirm: async () => {
          await fetchRevertNotificationToDraft(row.id);
          message.success($t('page.notificationManagement.revertToDraftSuccess'));
          getData();
        }
      });
    }

    async function confirmArchive(row: Notification) {
      if (!canWrite.value) return;

      await dialog.confirm({
        title: $t('page.notificationManagement.confirmArchiveTitle'),
        content: $t('page.notificationManagement.confirmArchive', { title: row.title }),
        type: 'warning',
        onConfirm: async () => {
          await fetchArchiveNotification(row.id);
          message.success($t('page.notificationManagement.archiveSuccess'));
          getData();
        }
      });
    }

    async function handleDelete(row: Notification) {
      if (!canDelete.value) return;

      await dialog.confirmDelete(row.title, async () => {
        await fetchDeleteNotification(row.id);
        message.success($t('common.deleteSuccess'));
        getData();
      });
    }

    async function handleBatchDelete() {
      if (!canDelete.value) return;

      if (selectedRowKeys.value.length === 0) {
        message.warning($t('page.notificationManagement.selectNotificationsToDelete'));
        return;
      }
      await dialog.confirmDelete(
        $t('page.notificationManagement.confirmBatchDelete', {
          count: selectedRowKeys.value.length
        }),
        async () => {
          const { data: result, error } = await fetchBatchDeleteNotifications({
            ids: selectedRowKeys.value
          });
          if (error) {
            return;
          }

          const failedCount = result?.failedIds?.length ?? 0;
          const deletedCount = result?.deletedCount ?? 0;

          if (failedCount > 0) {
            message.warning(
              $t('page.notificationManagement.batchDeletePartialSuccess', {
                deleted: deletedCount,
                failed: failedCount
              })
            );
          } else {
            message.success($t('page.notificationManagement.batchDeleteSuccess'));
          }

          selectedRowKeys.value = [];
          getData();
        }
      );
    }

    const searchConfig = computed(() => createNotificationSearchFields());

    const tableColumns = computed(() =>
      createNotificationTableColumns({
        canWrite: canWrite.value,
        canDelete: canDelete.value,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onPublish: row => confirmPublish(row, false),
        onRepublish: row => confirmPublish(row, true),
        onRevertToDraft: confirmRevertToDraft,
        onArchive: confirmArchive
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
        scrollX={NOTIFICATION_LIST_SCROLL_X}
        searchCardBordered={false}
        actionCardBordered={false}
      />
    );
  }
});
