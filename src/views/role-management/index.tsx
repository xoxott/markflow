import { computed, defineComponent, getCurrentInstance, onMounted, ref } from 'vue';
import type { TreeOption } from 'naive-ui';
import { useMessage } from 'naive-ui';
import { QUERY_BOOLEAN_TRUE } from '@/constants/queryBoolean';
import { fetchPermissionList } from '@/service/api/permission';
import {
  fetchAssignRolePermissions,
  fetchCreateRole,
  fetchDeleteRole,
  fetchRoleDetail,
  fetchRoleList,
  fetchRoleOptions,
  fetchUpdateRole
} from '@/service/api/role';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { $t } from '@/locales';
import { useDialog } from '@/components/base-dialog/useDialog';
import type { RoleFormData, RoleSelectOption } from './components/dialog';
import { useRoleDialog } from './components/useRoleDialog';
import { useRolePermissionDialog } from './components/useRolePermissionDialog';
import { ROLE_LIST_SCROLL_X, createRoleSearchFields, createRoleTableColumns } from './listUiConfig';
import { mapPermissionListToOptions } from './utils/permissionTree';

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

    const permissionTreeOptions = ref<TreeOption[]>([]);
    const allRoles = ref<Role[]>([]);

    const { data, loading, pagination, getData, searchParams, onSearch, onReset } =
      useAdminListTable({
        apiFn: fetchRoleList,
        listFilters: {
          search: '',
          isActive: undefined,
          isSystem: undefined
        },
        showTotal: true,
        immediate: true
      });

    function buildParentRoleOptions(excludeRoleId?: number): RoleSelectOption[] {
      return allRoles.value
        .filter(role => role.id !== excludeRoleId)
        .map(role => ({
          label: `${role.name} (${role.code})`,
          value: role.id
        }));
    }

    async function loadPermissionOptions() {
      try {
        const { data: listData } = await fetchPermissionList({
          page: 1,
          limit: 100,
          isActive: QUERY_BOOLEAN_TRUE
        });
        const lists = listData?.lists ?? [];
        permissionTreeOptions.value = mapPermissionListToOptions(lists);
      } catch {
        permissionTreeOptions.value = [];
      }
    }

    async function loadRoleOptions() {
      try {
        const { data: rolesData } = await fetchRoleOptions({ limit: 100 });
        allRoles.value = Array.isArray(rolesData?.lists) ? rolesData.lists : [];
      } catch {
        allRoles.value = [];
      }
    }

    async function ensureDialogOptions() {
      if (permissionTreeOptions.value.length === 0) {
        await loadPermissionOptions();
      }
      if (allRoles.value.length === 0) {
        await loadRoleOptions();
      }
    }

    async function handleAdd() {
      await ensureDialogOptions();

      await roleDialog.showRoleForm({
        isEdit: false,
        formData: createEmptyRoleForm(),
        permissionTreeOptions: permissionTreeOptions.value,
        parentRoleOptions: buildParentRoleOptions(),
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
          await loadRoleOptions();
          getData();
        }
      });
    }

    async function handleEdit(row: Role) {
      await ensureDialogOptions();

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
        permissionTreeOptions: permissionTreeOptions.value,
        parentRoleOptions: buildParentRoleOptions(row.id),
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
          await loadRoleOptions();
          getData();
        }
      });
    }

    async function handleAssignPermissions(row: Role) {
      await ensureDialogOptions();

      let permissionIds = row.permissions?.map(p => p.id) ?? [];
      if (permissionIds.length === 0) {
        const { data: roleDetail } = await fetchRoleDetail(row.id);
        permissionIds = roleDetail?.permissions?.map(p => p.id) ?? [];
      }

      await rolePermissionDialog.showRolePermission({
        roleId: row.id,
        roleName: row.name,
        permissionIds,
        permissionTreeOptions: permissionTreeOptions.value,
        onConfirm: async ids => {
          await fetchAssignRolePermissions(row.id, { permissionIds: ids });
          message.success($t('page.roleManagement.assignPermissionsSuccess'));
          getData();
        }
      });
    }

    async function handleDelete(row: Role) {
      await dialog.confirmDelete(row.name, async () => {
        await fetchDeleteRole(row.id);
        message.success($t('common.deleteSuccess'));
        await loadRoleOptions();
        getData();
      });
    }

    onMounted(() => {
      loadPermissionOptions();
      loadRoleOptions();
    });

    const searchConfig = computed(() => createRoleSearchFields());

    const tableColumns = computed(() =>
      createRoleTableColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onAssignPermissions: handleAssignPermissions
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
