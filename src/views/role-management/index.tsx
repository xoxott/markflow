import { computed, defineComponent, getCurrentInstance } from 'vue';
import { useMessage } from 'naive-ui';
import {
  fetchAssignRolePermissions,
  fetchCreateRole,
  fetchDeleteRole,
  fetchRoleDetail,
  fetchRoleList,
  fetchUpdateRole
} from '@/service/api/role';
import { useAdminOptionStore } from '@/store/modules/admin-option';
import { parseQueryNumber } from '@/hooks/common/useRouteQueryFilters';
import { useRouterPush } from '@/hooks/common/router';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { $t } from '@/locales';
import { useDialog } from '@/components/base-dialog/useDialog';
import type { RoleFormData } from './components/dialog';
import { useRoleDialog } from './components/useRoleDialog';
import { useRolePermissionDialog } from './components/useRolePermissionDialog';
import { ROLE_LIST_SCROLL_X, createRoleSearchFields, createRoleTableColumns } from './listUiConfig';

type Role = Api.RoleManagement.Role;

const DEFAULT_ROLE_LEVEL = 999;

function createEmptyRoleForm(): RoleFormData {
  return {
    name: '',
    code: '',
    description: '',
    level: DEFAULT_ROLE_LEVEL,
    permissionIds: [],
    parentRoleId: null
  };
}

export default defineComponent({
  name: 'RoleManagement',
  setup() {
    const message = useMessage();
    const instance = getCurrentInstance();
    const roleDialog = useRoleDialog();
    const rolePermissionDialog = useRolePermissionDialog();
    const dialog = useDialog(instance?.appContext.app);
    const adminOptionStore = useAdminOptionStore();

    const { data, loading, pagination, getData, searchParams, onSearch, onReset } =
      useAdminListTable({
        apiFn: fetchRoleList,
        listFilters: {
          search: '',
          isActive: undefined,
          isSystem: undefined,
          permissionId: undefined as number | undefined,
          parentRoleId: undefined as number | undefined,
          hasParentRole: undefined
        },
        showTotal: true,
        routeQuery: {
          mapping: {
            search: { field: 'search' },
            permissionId: { field: 'permissionId', parse: parseQueryNumber },
            parentRoleId: { field: 'parentRoleId', parse: parseQueryNumber },
            hasParentRole: { field: 'hasParentRole' }
          }
        }
      });

    const { routerPushByKey } = useRouterPush();

    function handleViewMembers(row: Role) {
      routerPushByKey('user-management', { query: { roleId: String(row.id) } });
    }

    function invalidateRoleOptions() {
      adminOptionStore.invalidateResource('roles');
      adminOptionStore.invalidateResource('permissions');
    }

    async function handleAdd() {
      await roleDialog.showRoleForm({
        isEdit: false,
        formData: createEmptyRoleForm(),
        onConfirm: async (form: RoleFormData) => {
          await fetchCreateRole({
            name: form.name,
            code: form.code,
            description: form.description || undefined,
            level: form.level,
            ...(form.permissionIds.length > 0 ? { permissionIds: form.permissionIds } : {}),
            ...(form.parentRoleId !== null ? { parentRoleId: form.parentRoleId } : {})
          });
          message.success($t('common.addSuccess'));
          invalidateRoleOptions();
          getData();
        }
      });
    }

    async function handleEdit(row: Role) {
      const { data: roleDetail } = await fetchRoleDetail(row.id);
      if (!roleDetail) {
        message.error($t('page.roleManagement.getDetailFailed'));
        return;
      }

      const originalCode = roleDetail.code;

      const formData: RoleFormData = {
        name: roleDetail.name,
        code: roleDetail.code,
        description: roleDetail.description || '',
        level: roleDetail.level ?? DEFAULT_ROLE_LEVEL,
        permissionIds: roleDetail.permissions?.map(p => p.id) ?? [],
        parentRoleId: roleDetail.parentRole?.id ?? null
      };

      await roleDialog.showRoleForm({
        isEdit: true,
        roleId: row.id,
        isSystem: roleDetail.isSystem,
        formData,
        permissions: roleDetail.permissions?.map(p => ({ id: p.id, name: p.name })) ?? [],
        parentRole: roleDetail.parentRole
          ? { id: roleDetail.parentRole.id, name: roleDetail.parentRole.name }
          : null,
        onConfirm: async (form: RoleFormData) => {
          const payload: Api.RoleManagement.UpdateRoleRequest = {
            name: form.name,
            description: form.description || undefined,
            level: form.level,
            permissionIds: form.permissionIds,
            parentRoleId: form.parentRoleId
          };
          if (!roleDetail.isSystem && form.code !== originalCode) {
            payload.code = form.code;
          }
          await fetchUpdateRole(row.id, payload);
          message.success($t('common.updateSuccess'));
          invalidateRoleOptions();
          getData();
        }
      });
    }

    async function handleAssignPermissions(row: Role) {
      let permissions = row.permissions ?? [];
      if (permissions.length === 0) {
        const { data: roleDetail } = await fetchRoleDetail(row.id);
        permissions = roleDetail?.permissions ?? [];
      }
      const permissionIds = permissions.map(p => p.id);

      await rolePermissionDialog.showRolePermission({
        roleId: row.id,
        roleName: row.name,
        permissionIds,
        permissions: permissions.map(p => ({ id: p.id, name: p.name })),
        onConfirm: async ids => {
          await fetchAssignRolePermissions(row.id, { permissionIds: ids });
          message.success($t('page.roleManagement.assignPermissionsSuccess'));
          adminOptionStore.invalidateResource('permissions');
          getData();
        }
      });
    }

    async function handleDelete(row: Role) {
      await dialog.confirmDelete(row.name, async () => {
        await fetchDeleteRole(row.id);
        message.success($t('common.deleteSuccess'));
        invalidateRoleOptions();
        getData();
      });
    }

    const searchConfig = computed(() => createRoleSearchFields());

    const tableColumns = computed(() =>
      createRoleTableColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onAssignPermissions: handleAssignPermissions,
        onViewMembers: handleViewMembers
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
            refresh: { onClick: getData }
          }
        }}
        columns={tableColumns.value}
        data={data.value}
        loading={loading.value}
        pagination={pagination}
        rowKey="id"
        scrollX={ROLE_LIST_SCROLL_X}
        searchCardBordered={false}
        actionCardBordered={false}
      />
    );
  }
});
