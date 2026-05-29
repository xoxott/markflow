import { computed, defineComponent, getCurrentInstance } from 'vue';
import { useMessage } from 'naive-ui';
import {
  fetchCreateRole,
  fetchDeleteRole,
  fetchRoleDetail,
  fetchRoleList,
  fetchUpdateRole
} from '@/service/api/role';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { $t } from '@/locales';
import { useDialog } from '@/components/base-dialog/useDialog';
import type { RoleFormData } from './components/dialog';
import { useRoleDialog } from './components/useRoleDialog';
import { ROLE_LIST_SCROLL_X, createRoleSearchFields, createRoleTableColumns } from './listUiConfig';

type Role = Api.RoleManagement.Role;

const DEFAULT_ROLE_LEVEL = 999;

export default defineComponent({
  name: 'RoleManagement',
  setup() {
    const message = useMessage();
    const instance = getCurrentInstance();
    const roleDialog = useRoleDialog();
    const dialog = useDialog(instance?.appContext.app);

    const { data, loading, pagination, getData, searchParams, onSearch, onReset } =
      useAdminListTable({
        apiFn: fetchRoleList,
        listFilters: {
          search: '',
          isActive: undefined as number | undefined
        },
        showTotal: true,
        immediate: true
      });

    async function handleAdd() {
      const formData: RoleFormData = {
        name: '',
        code: '',
        description: '',
        level: DEFAULT_ROLE_LEVEL
      };

      await roleDialog.showRoleForm({
        isEdit: false,
        formData,
        onConfirm: async (form: RoleFormData) => {
          await fetchCreateRole({
            name: form.name,
            code: form.code,
            description: form.description || undefined,
            level: form.level
          });
          message.success($t('common.addSuccess'));
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

      const formData: RoleFormData = {
        name: roleDetail.name,
        code: roleDetail.code,
        description: roleDetail.description || '',
        level: roleDetail.level ?? DEFAULT_ROLE_LEVEL
      };

      await roleDialog.showRoleForm({
        isEdit: true,
        formData,
        onConfirm: async (form: RoleFormData) => {
          await fetchUpdateRole(row.id, {
            name: form.name,
            description: form.description || undefined,
            level: form.level
          });
          message.success($t('common.updateSuccess'));
          getData();
        }
      });
    }

    async function handleDelete(row: Role) {
      await dialog.confirmDelete(row.name, async () => {
        await fetchDeleteRole(row.id);
        message.success($t('common.deleteSuccess'));
        getData();
      });
    }

    const searchConfig = computed(() => createRoleSearchFields());

    const tableColumns = computed(() =>
      createRoleTableColumns({
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
