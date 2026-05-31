import { computed, defineComponent, getCurrentInstance, ref } from 'vue';
import { useMessage } from 'naive-ui';
import {
  fetchBatchDeleteLogs,
  fetchDeleteLog,
  fetchDeleteOldLogs,
  fetchLogDetail,
  fetchLogList
} from '@/service/api/log';
import { useAuthStore } from '@/store/modules/auth';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { $t } from '@/locales';
import { useDialog } from '@/components/base-dialog/useDialog';
import { useLogDetailDrawer } from './components/useLogDetailDrawer';
import {
  LOG_LIST_SCROLL_X,
  type LogListFilterLogType,
  createLogSearchFields,
  createLogTableColumns,
  serializeLogListFilters
} from './listUiConfig';

type Log = Api.LogManagement.Log;

const SUPER_ADMIN_ROLE_CODE = 'super_admin';
const DEFAULT_OLD_LOG_DAYS = 30;

type LogListTableParams = Omit<Api.LogManagement.LogListParams, 'logType'> & {
  logType?: LogListFilterLogType;
};

function fetchLogListForTable(params: LogListTableParams) {
  const serialized = serializeLogListFilters(params as unknown as Record<string, unknown>);

  return fetchLogList({
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    ...serialized
  });
}

export default defineComponent({
  name: 'LogManagement',
  setup() {
    const message = useMessage();
    const instance = getCurrentInstance();
    const dialog = useDialog(instance?.appContext.app);
    const logDetailDrawer = useLogDetailDrawer();
    const authStore = useAuthStore();

    const selectedRowKeys = ref<number[]>([]);

    const isSuperAdmin = computed(() =>
      authStore.userInfo.roles?.some(role => role.code === SUPER_ADMIN_ROLE_CODE)
    );

    const { data, loading, pagination, getData, searchParams, onSearch, onReset } =
      useAdminListTable({
        apiFn: fetchLogListForTable,
        listFilters: {
          logType: 'access' as LogListFilterLogType,
          search: '',
          userId: undefined,
          ip: undefined,
          statusCode: undefined,
          method: undefined,
          startDate: undefined,
          endDate: undefined,
          sortBy: undefined,
          sortOrder: undefined
        },
        showTotal: true,
        immediate: true
      });

    async function handleViewDetail(row: Log) {
      const loadingRef = message.loading($t('page.logManagement.loadingDetail'), { duration: 0 });

      try {
        const { data: logDetail } = await fetchLogDetail(row.id);
        if (logDetail) {
          await logDetailDrawer.open(logDetail);
        } else {
          message.warning($t('page.logManagement.logDetailNotFound'));
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        message.error(err?.message || $t('page.logManagement.getDetailFailed'));
      } finally {
        loadingRef.destroy();
      }
    }

    async function handleDelete(row: Log) {
      await dialog.confirmDelete($t('page.logManagement.confirmDelete'), async () => {
        await fetchDeleteLog(row.id);
        message.success($t('common.deleteSuccess'));
        getData();
      });
    }

    async function handleBatchDelete() {
      if (selectedRowKeys.value.length === 0) {
        message.warning($t('page.logManagement.selectLogsToDelete'));
        return;
      }
      await dialog.confirmDelete(
        $t('page.logManagement.confirmBatchDelete', { count: selectedRowKeys.value.length }),
        async () => {
          const { data: result, error } = await fetchBatchDeleteLogs({
            ids: selectedRowKeys.value
          });
          if (error) {
            return;
          }

          const failedCount = result?.failedIds?.length ?? 0;
          const deletedCount = result?.deletedCount ?? 0;

          if (failedCount > 0) {
            message.warning(
              $t('page.logManagement.batchDeletePartialSuccess', {
                deleted: deletedCount,
                failed: failedCount
              })
            );
          } else {
            message.success($t('page.logManagement.batchDeleteSuccess'));
          }

          selectedRowKeys.value = [];
          getData();
        }
      );
    }

    async function handleClearOldLogs() {
      if (!isSuperAdmin.value) {
        return;
      }

      await dialog.confirmDelete(
        $t('page.logManagement.confirmClearOldLogs', { days: DEFAULT_OLD_LOG_DAYS }),
        async () => {
          const { data: deletedCount, error } = await fetchDeleteOldLogs(DEFAULT_OLD_LOG_DAYS);
          if (error) {
            return;
          }

          message.success(
            $t('page.logManagement.clearOldLogsSuccess', {
              count: deletedCount ?? 0
            })
          );
          selectedRowKeys.value = [];
          getData();
        }
      );
    }

    const searchConfig = computed(() => createLogSearchFields());

    const tableColumns = computed(() =>
      createLogTableColumns({
        onView: handleViewDetail,
        onDelete: handleDelete
      })
    );

    const actionCustom = computed(() => {
      if (!isSuperAdmin.value) {
        return [];
      }

      return [
        {
          label: $t('page.logManagement.clearOldLogs'),
          icon: 'carbon:clean',
          type: 'warning' as const,
          onClick: handleClearOldLogs
        }
      ];
    });

    return () => (
      <TablePage
        class="h-full"
        searchConfig={searchConfig.value}
        searchModel={searchParams}
        onSearch={onSearch}
        onReset={onReset}
        actionConfig={{
          preset: {
            batchDelete: { onClick: handleBatchDelete },
            refresh: { onClick: getData }
          },
          custom: actionCustom.value
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
        scrollX={LOG_LIST_SCROLL_X}
        searchLabelWidth={96}
        searchCardBordered={false}
        actionCardBordered={false}
      />
    );
  }
});
