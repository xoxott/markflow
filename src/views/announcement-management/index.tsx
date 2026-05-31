import { computed, defineComponent, getCurrentInstance, ref } from 'vue';
import { useMessage } from 'naive-ui';
import {
  fetchAnnouncementDetail,
  fetchAnnouncementList,
  fetchArchiveAnnouncement,
  fetchCreateAnnouncement,
  fetchDeleteAnnouncement,
  fetchPublishAnnouncement,
  fetchRevertAnnouncementToDraft,
  fetchUpdateAnnouncement
} from '@/service/api/announcement';
import { useAuthStore } from '@/store/modules/auth';
import { hasPermissionAccess } from '@/utils/rbac/permission-access';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { $t } from '@/locales';
import { useDialog } from '@/components/base-dialog/useDialog';
import type { AnnouncementFormData } from './components/dialog';
import { useAnnouncementDialog } from './components/useAnnouncementDialog';
import { buildWritePayload, createEmptyForm } from './utils/announcement-form';
import {
  ANNOUNCEMENT_LIST_SCROLL_X,
  createAnnouncementSearchFields,
  createAnnouncementTableColumns
} from './listUiConfig';

type Announcement = Api.AnnouncementManagement.Announcement;

export default defineComponent({
  name: 'AnnouncementManagement',
  setup() {
    const message = useMessage();
    const instance = getCurrentInstance();
    const announcementDialog = useAnnouncementDialog();
    const dialog = useDialog(instance?.appContext.app);
    const authStore = useAuthStore();

    const canWrite = computed(() =>
      hasPermissionAccess(authStore.permissionCodes, ['announcement:write'])
    );

    const selectedRowKeys = ref<number[]>([]);

    const { data, loading, pagination, getData, searchParams, onSearch, onReset } =
      useAdminListTable({
        apiFn: fetchAnnouncementList,
        listFilters: {
          search: '',
          status: undefined as Api.AnnouncementManagement.AnnouncementStatus | undefined,
          type: undefined as Api.AnnouncementManagement.AnnouncementType | undefined
        },
        showTotal: true,
        immediate: true
      });

    async function handleAdd() {
      if (!canWrite.value) return;

      await announcementDialog.showAnnouncementForm({
        isEdit: false,
        formData: createEmptyForm(),
        onConfirm: async form => {
          await fetchCreateAnnouncement(buildWritePayload(form));
          message.success($t('common.addSuccess'));
          getData();
        }
      });
    }

    async function handleEdit(row: Announcement) {
      if (!canWrite.value || row.status !== 'draft') return;

      const { data: announcementDetail, error } = await fetchAnnouncementDetail(row.id);
      if (error || !announcementDetail) {
        message.error($t('page.announcementManagement.getDetailFailed'));
        return;
      }

      const formData: AnnouncementFormData = {
        title: announcementDetail.title,
        content: announcementDetail.content,
        type: announcementDetail.type,
        priority: announcementDetail.priority,
        sticky: announcementDetail.sticky,
        expiresAt: announcementDetail.expiresAt || '',
        targetAudience: announcementDetail.targetAudience?.join(', ') || ''
      };

      await announcementDialog.showAnnouncementForm({
        isEdit: true,
        formData,
        onConfirm: async form => {
          await fetchUpdateAnnouncement(row.id, buildWritePayload(form));
          message.success($t('common.updateSuccess'));
          getData();
        }
      });
    }

    async function confirmPublish(row: Announcement, republish: boolean) {
      if (!canWrite.value) return;

      await dialog.confirm({
        title: republish
          ? $t('page.announcementManagement.confirmRepublishTitle')
          : $t('page.announcementManagement.confirmPublishTitle'),
        content: republish
          ? $t('page.announcementManagement.confirmRepublish', { title: row.title })
          : $t('page.announcementManagement.confirmPublish', { title: row.title }),
        type: 'info',
        onConfirm: async () => {
          await fetchPublishAnnouncement(row.id);
          message.success(
            republish
              ? $t('page.announcementManagement.republishSuccess')
              : $t('page.announcementManagement.publishSuccess')
          );
          getData();
        }
      });
    }

    async function confirmRevertToDraft(row: Announcement) {
      if (!canWrite.value) return;

      await dialog.confirm({
        title: $t('page.announcementManagement.confirmRevertToDraftTitle'),
        content: $t('page.announcementManagement.confirmRevertToDraft', { title: row.title }),
        type: 'warning',
        onConfirm: async () => {
          await fetchRevertAnnouncementToDraft(row.id);
          message.success($t('page.announcementManagement.revertToDraftSuccess'));
          getData();
        }
      });
    }

    async function confirmArchive(row: Announcement) {
      if (!canWrite.value) return;

      await dialog.confirm({
        title: $t('page.announcementManagement.confirmArchiveTitle'),
        content: $t('page.announcementManagement.confirmArchive', { title: row.title }),
        type: 'warning',
        onConfirm: async () => {
          await fetchArchiveAnnouncement(row.id);
          message.success($t('page.announcementManagement.archiveSuccess'));
          getData();
        }
      });
    }

    async function handleDelete(row: Announcement) {
      if (!canWrite.value || row.status !== 'draft') return;

      await dialog.confirmDelete(row.title, async () => {
        await fetchDeleteAnnouncement(row.id);
        message.success($t('common.deleteSuccess'));
        getData();
      });
    }

    async function handleBatchDelete() {
      if (!canWrite.value) return;

      if (selectedRowKeys.value.length === 0) {
        message.warning($t('page.announcementManagement.selectAnnouncementsToDelete'));
        return;
      }

      const hasNonDraft = selectedRowKeys.value.some(id => {
        const row = data.value.find(item => item.id === id);
        return row?.status !== 'draft';
      });
      if (hasNonDraft) {
        message.warning($t('page.announcementManagement.draftOnlyDelete'));
        return;
      }

      await dialog.confirmDelete(
        $t('page.announcementManagement.confirmBatchDelete', {
          count: selectedRowKeys.value.length
        }),
        async () => {
          await Promise.all(selectedRowKeys.value.map(id => fetchDeleteAnnouncement(id)));
          message.success($t('page.announcementManagement.batchDeleteSuccess'));
          selectedRowKeys.value = [];
          getData();
        }
      );
    }

    const searchConfig = computed(() => createAnnouncementSearchFields());

    const tableColumns = computed(() =>
      createAnnouncementTableColumns({
        canWrite: canWrite.value,
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
            batchDelete: canWrite.value ? { onClick: handleBatchDelete } : undefined,
            refresh: { onClick: getData }
          }
        }}
        columns={tableColumns.value}
        data={data.value}
        loading={loading.value}
        pagination={pagination}
        selectedKeys={canWrite.value ? selectedRowKeys.value : []}
        onUpdateSelectedKeys={keys => {
          if (canWrite.value) {
            selectedRowKeys.value = keys as number[];
          }
        }}
        rowKey="id"
        scrollX={ANNOUNCEMENT_LIST_SCROLL_X}
        searchCardBordered={false}
        actionCardBordered={false}
      />
    );
  }
});
