import { computed, defineComponent, getCurrentInstance, ref } from 'vue';
import { useMessage } from 'naive-ui';
import {
  fetchBatchDeletePermissions,
  fetchCreatePermission,
  fetchDeletePermission,
  fetchPermissionDetail,
  fetchPermissionList,
  fetchTogglePermissionStatus,
  fetchUpdatePermission
} from '@/service/api/permission';
import { useAdminOptionStore } from '@/store/modules/admin-option';
import { parseQueryNumber, readRouteQueryValue } from '@/hooks/common/useRouteQueryFilters';
import { useRouterPush } from '@/hooks/common/router';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { $t } from '@/locales';
import { useDialog } from '@/components/base-dialog/useDialog';
import type { PermissionFormData } from './components/dialog';
import { usePermissionDialog } from './components/usePermissionDialog';
import {
  PERMISSION_LIST_SCROLL_X,
  createPermissionSearchFields,
  createPermissionTableColumns
} from './listUiConfig';

type Permission = Api.PermissionManagement.Permission;

export default defineComponent({
  name: 'PermissionManagement',
  setup() {
    const message = useMessage();
    const instance = getCurrentInstance();
    const permissionDialog = usePermissionDialog();
    const dialog = useDialog(instance?.appContext.app);
    const adminOptionStore = useAdminOptionStore();
    const { routerPushByKey } = useRouterPush();

    const selectedRowKeys = ref<number[]>([]);

    const { data, loading, pagination, getData, searchParams, onSearch, onReset } =
      useAdminListTable({
        apiFn: fetchPermissionList,
        listFilters: {
          search: '',
          isActive: undefined,
          resource: undefined as string | undefined,
          action: undefined as string | undefined,
          sortBy: undefined as string | undefined,
          sortOrder: undefined as 'asc' | 'desc' | undefined
        },
        showTotal: true,
        routeQuery: {
          mapping: {
            search: { field: 'search' },
            resource: { field: 'resource' },
            action: { field: 'action' }
          },
          extraQueryKeys: ['permissionId'],
          resolve: async (query, params) => {
            const permissionId = parseQueryNumber(readRouteQueryValue(query.permissionId) ?? '');
            if (!permissionId) {
              return false;
            }

            const { data: permissionDetail } = await fetchPermissionDetail(permissionId);
            if (!permissionDetail) {
              return false;
            }

            params.resource = permissionDetail.resource;
            params.action = permissionDetail.action;
            return true;
          }
        }
      });

    function handleViewRelatedRoles(row: Permission) {
      routerPushByKey('role-management', { query: { permissionId: String(row.id) } });
    }

    async function handleAdd() {
      const formData: PermissionFormData = {
        name: '',
        code: '',
        resourceId: null,
        resource: '',
        action: '',
        description: '',
        isActive: true
      };

      await permissionDialog.showPermissionForm({
        isEdit: false,
        formData,
        onConfirm: async (form: PermissionFormData) => {
          if (!form.resourceId) {
            return;
          }
          await fetchCreatePermission({
            name: form.name,
            resourceId: form.resourceId,
            action: form.action,
            description: form.description || undefined
          });
          message.success($t('common.addSuccess'));
          adminOptionStore.invalidateResource('permissions');
          getData();
        }
      });
    }

    async function handleEdit(row: Permission) {
      const { data: permissionDetail } = await fetchPermissionDetail(row.id);
      if (!permissionDetail) {
        message.error($t('page.permissionManagement.getDetailFailed'));
        return;
      }

      const formData: PermissionFormData = {
        name: permissionDetail.name,
        code: permissionDetail.code,
        resourceId: permissionDetail.resourceId ?? null,
        resource: permissionDetail.resource,
        action: permissionDetail.action,
        description: permissionDetail.description || '',
        isActive: permissionDetail.isActive
      };

      await permissionDialog.showPermissionForm({
        isEdit: true,
        formData,
        onConfirm: async (form: PermissionFormData) => {
          await fetchUpdatePermission(row.id, {
            name: form.name,
            description: form.description || undefined
          });
          message.success($t('common.updateSuccess'));
          adminOptionStore.invalidateResource('permissions');
          getData();
        }
      });
    }

    async function handleToggleStatus(permissionId: number, isActive: boolean) {
      try {
        await fetchTogglePermissionStatus(permissionId, isActive);
        message.success($t('page.permissionManagement.toggleStatusSuccess'));
        adminOptionStore.invalidateResource('permissions');
        getData();
      } catch {
        getData();
      }
    }

    async function handleDelete(row: Permission) {
      await dialog.confirmDelete(row.name, async () => {
        await fetchDeletePermission(row.id);
        message.success($t('common.deleteSuccess'));
        adminOptionStore.invalidateResource('permissions');
        getData();
      });
    }

    async function handleBatchDelete() {
      if (selectedRowKeys.value.length === 0) {
        message.warning($t('page.permissionManagement.selectPermissionsToDelete'));
        return;
      }

      await dialog.confirmDelete(
        $t('page.permissionManagement.confirmBatchDelete', {
          count: selectedRowKeys.value.length
        }),
        async () => {
          const { data: result, error } = await fetchBatchDeletePermissions({
            ids: selectedRowKeys.value
          });
          if (error) {
            return;
          }

          const failedCount = result?.failedIds?.length ?? 0;
          const deletedCount = result?.deletedCount ?? 0;

          if (failedCount > 0) {
            message.warning(
              $t('page.permissionManagement.batchDeletePartialSuccess', {
                deleted: deletedCount,
                failed: failedCount
              })
            );
          } else {
            message.success($t('page.permissionManagement.batchDeleteSuccess'));
          }

          adminOptionStore.invalidateResource('permissions');
          selectedRowKeys.value = [];
          getData();
        }
      );
    }

    const searchConfig = computed(() => createPermissionSearchFields());

    const tableColumns = computed(() =>
      createPermissionTableColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onToggleStatus: handleToggleStatus,
        onViewRelatedRoles: handleViewRelatedRoles
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
        scrollX={PERMISSION_LIST_SCROLL_X}
        searchCardBordered={false}
        actionCardBordered={false}
      />
    );
  }
});
