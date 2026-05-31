import { computed, defineComponent, getCurrentInstance, ref } from 'vue';
import { useMessage } from 'naive-ui';
import {
  fetchBatchDeleteVersionLogs,
  fetchCreateVersionLog,
  fetchDeleteVersionLog,
  fetchUpdateVersionLog,
  fetchVersionLogDetail,
  fetchVersionLogList
} from '@/service/api/version-log';
import { useDialog } from '@/components/base-dialog/useDialog';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { $t } from '@/locales';
import { useVersionLogDialog } from './components/useVersionLogDialog';
import {
  VERSION_LOG_LIST_SCROLL_X,
  createVersionLogSearchFields,
  createVersionLogTableColumns,
  normalizeVersionLogRemoteSorter
} from './listUiConfig';
import {
  buildCreatePayload,
  buildUpdatePayload,
  createEmptyForm,
  mapDetailToForm
} from './utils/changelog-form';

type VersionLog = Api.VersionLogManagement.VersionLog;

function getRequestErrorMessage(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : undefined;
  }

  return undefined;
}

export default defineComponent({
  name: 'VersionLogManagement',
  setup() {
    const message = useMessage();
    const instance = getCurrentInstance();
    const versionLogDialog = useVersionLogDialog();
    const dialog = useDialog(instance?.appContext.app);

    const selectedRowKeys = ref<number[]>([]);

    const {
      data,
      loading,
      pagination,
      getData,
      searchParams,
      updateSearchParams,
      onSearch,
      onReset,
      getListLimit
    } = useAdminListTable({
      apiFn: fetchVersionLogList,
      listFilters: {
        search: '',
        sortBy: undefined as string | undefined,
        sortOrder: undefined as 'ASC' | 'DESC' | undefined
      },
      showTotal: true,
      immediate: true
    });

    async function handleAdd() {
      await versionLogDialog.showVersionLogForm({
        isEdit: false,
        formData: createEmptyForm(),
        onConfirm: async form => {
          const { error } = await fetchCreateVersionLog(buildCreatePayload(form));
          if (error) {
            message.error(
              getRequestErrorMessage(error) || $t('page.versionLogManagement.saveFailed')
            );
            return;
          }

          message.success($t('common.addSuccess'));
          getData();
          return true;
        }
      });
    }

    async function handleEdit(row: VersionLog) {
      const loadingRef = message.loading($t('page.versionLogManagement.loadingDetail'), {
        duration: 0
      });

      let versionLogDetail: VersionLog | null = null;

      try {
        const { data: detail, error } = await fetchVersionLogDetail(row.id);
        if (error || !detail) {
          message.error($t('page.versionLogManagement.getDetailFailed'));
          return;
        }

        versionLogDetail = detail;
      } finally {
        loadingRef.destroy();
      }

      await versionLogDialog.showVersionLogForm({
        isEdit: true,
        formData: mapDetailToForm(versionLogDetail),
        onConfirm: async form => {
          const { error } = await fetchUpdateVersionLog(row.id, buildUpdatePayload(form));
          if (error) {
            message.error(
              getRequestErrorMessage(error) || $t('page.versionLogManagement.saveFailed')
            );
            return;
          }

          message.success($t('common.updateSuccess'));
          getData();
          return true;
        }
      });
    }

    async function handleDelete(row: VersionLog) {
      await dialog.confirmDelete(row.version, async () => {
        await fetchDeleteVersionLog(row.id);
        message.success($t('common.deleteSuccess'));
        getData();
      });
    }

    async function handleBatchDelete() {
      if (selectedRowKeys.value.length === 0) {
        message.warning($t('page.versionLogManagement.selectVersionLogsToDelete'));
        return;
      }

      await dialog.confirmDelete(
        $t('page.versionLogManagement.confirmBatchDelete', {
          count: selectedRowKeys.value.length
        }),
        async () => {
          const { data: result, error } = await fetchBatchDeleteVersionLogs({
            ids: selectedRowKeys.value
          });
          if (error) {
            return;
          }

          const failedCount = result?.failedIds?.length ?? 0;
          const deletedCount = result?.deletedCount ?? 0;

          if (failedCount > 0) {
            message.warning(
              $t('page.versionLogManagement.batchDeletePartialSuccess', {
                deleted: deletedCount,
                failed: failedCount
              })
            );
          } else {
            message.success($t('page.versionLogManagement.batchDeleteSuccess'));
          }

          selectedRowKeys.value = [];
          getData();
        }
      );
    }

    const searchConfig = computed(() => createVersionLogSearchFields());

    const tableColumns = computed(() =>
      createVersionLogTableColumns({
        onEdit: handleEdit,
        onDelete: handleDelete
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
            add: { onClick: handleAdd },
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
          selectedRowKeys.value = keys as number[];
        }}
        rowKey="id"
        scrollX={VERSION_LOG_LIST_SCROLL_X}
        searchCardBordered={false}
        actionCardBordered={false}
        tableProps={{
          remote: true,
          onUpdateSorter: sorter => {
            const { sortBy, sortOrder } = normalizeVersionLogRemoteSorter(sorter);
            updateSearchParams({
              sortBy,
              sortOrder,
              page: 1,
              limit: getListLimit()
            });
            getData();
          }
        }}
      />
    );
  }
});
