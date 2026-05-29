import { computed, defineComponent, getCurrentInstance, onMounted, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { useMessage } from 'naive-ui';
import {
  fetchAdminRoleOptions,
  fetchAssignUserRoles,
  fetchBatchBlacklistUsers,
  fetchBatchDeleteUsers,
  fetchBatchUpdateUserStatus,
  fetchBlacklistUser,
  fetchCreateUser,
  fetchDeleteUser,
  fetchExportUsers,
  fetchKickUser,
  fetchOnlineUsers,
  fetchUnblacklistUser,
  fetchUpdateUser,
  fetchUserDetail,
  fetchUserList,
  fetchUserStats
} from '@/service/api/user';
import TablePage from '@/components/table-page/TablePage';
import { useAdminListTable } from '@/components/table-page/hooks';
import { mergeTablePageColumnChecks } from '@/components/table-page/utils/columnChecks';
import { $t } from '@/locales';
import { useDialog } from '@/components/base-dialog/useDialog';
import type { UserFormData } from './components/dialog';
import { useBlacklistDialog } from './components/useBlacklistDialog';
import { useOnlineUsersDialog } from './components/useOnlineUsersDialog';
import { useUserDialog } from './components/useUserDialog';
import { useUserRoleDialog } from './components/useUserRoleDialog';
import UserDetailDrawer from './components/UserDetailDrawer';
import UserManagementToolbar from './components/UserManagementToolbar';
import { USER_LIST_SCROLL_X, createUserSearchFields, createUserTableColumns } from './listUiConfig';

type User = Api.UserManagement.User;

function createEmptyUserForm(): UserFormData {
  return {
    username: '',
    email: '',
    password: '',
    verificationCode: '',
    roleIds: [],
    avatar: ''
  };
}

export default defineComponent({
  name: 'UserManagement',
  setup() {
    const message = useMessage();
    const instance = getCurrentInstance();
    const userDialog = useUserDialog();
    const userRoleDialog = useUserRoleDialog();
    const blacklistDialog = useBlacklistDialog();
    const onlineUsersDialog = useOnlineUsersDialog();
    const dialog = useDialog(instance?.appContext.app);

    const selectedRowKeys = ref<number[]>([]);
    const roles = ref<Api.UserManagement.Role[]>([]);
    const userStats = ref<Api.UserManagement.UserStats | null>(null);
    const statsLoading = ref(false);
    const exportLoading = ref(false);
    const detailDrawerVisible = ref(false);
    const detailUser = ref<User | null>(null);
    const columnChecks = ref<NaiveUI.TableColumnCheck[]>([]);

    const roleOptions = computed<SelectOption[]>(() =>
      roles.value.map(role => ({
        label: role.name,
        value: role.id
      }))
    );

    const { data, loading, pagination, getData, searchParams, onSearch, onReset } =
      useAdminListTable({
        apiFn: fetchUserList,
        listFilters: {
          search: '',
          isActive: undefined,
          isOnline: undefined,
          isBlacklisted: undefined,
          roleCode: undefined,
          sortBy: undefined as string | undefined,
          sortOrder: undefined as 'asc' | 'desc' | undefined
        },
        showTotal: true,
        immediate: true
      });

    async function loadStats() {
      statsLoading.value = true;
      try {
        const { data: statsData, error } = await fetchUserStats();
        if (!error && statsData) {
          userStats.value = statsData;
        }
      } finally {
        statsLoading.value = false;
      }
    }

    async function refreshPage() {
      await Promise.all([getData(), loadStats()]);
    }

    async function loadRoles() {
      try {
        const { data: rolesData } = await fetchAdminRoleOptions();
        if (rolesData?.lists && Array.isArray(rolesData.lists)) {
          roles.value = rolesData.lists;
        } else {
          roles.value = [];
        }
      } catch {
        roles.value = [];
      }
    }

    function buildExportParams(format: Api.UserManagement.ExportFormat) {
      const params = searchParams as Api.UserManagement.UserListParams;
      return {
        format,
        search: params.search,
        isActive: params.isActive,
        isOnline: params.isOnline,
        isBlacklisted: params.isBlacklisted,
        roleCode: params.roleCode,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder
      };
    }

    async function handleExport(format: Api.UserManagement.ExportFormat) {
      exportLoading.value = true;
      try {
        await fetchExportUsers(buildExportParams(format));
        message.success($t('page.userManagement.exportSuccess'));
      } catch {
        message.error($t('page.userManagement.exportFailed'));
      } finally {
        exportLoading.value = false;
      }
    }

    async function handleShowOnlineUsers() {
      const { data: onlineUsers, error } = await fetchOnlineUsers();
      if (error) return;

      await onlineUsersDialog.showOnlineUsers({
        users: onlineUsers ?? []
      });
    }

    function closeDetailDrawer() {
      detailDrawerVisible.value = false;
    }

    async function openUserDetail(row: User) {
      const { data: userDetail, error } = await fetchUserDetail(row.id);
      if (error || !userDetail) {
        message.error($t('page.userManagement.getDetailFailed'));
        return;
      }
      detailUser.value = userDetail;
      detailDrawerVisible.value = true;
    }

    async function handleAdd() {
      await userDialog.showUserForm({
        isEdit: false,
        formData: createEmptyUserForm(),
        roleOptions: roleOptions.value,
        onConfirm: async (form: UserFormData) => {
          const { error } = await fetchCreateUser({
            username: form.username,
            email: form.email,
            password: form.password,
            verificationCode: form.verificationCode,
            roleIds: form.roleIds.length > 0 ? form.roleIds : undefined
          });
          if (error) return;

          message.success($t('common.addSuccess'));
          await refreshPage();
          return true;
        }
      });
    }

    async function handleEdit(row: User) {
      closeDetailDrawer();

      const { data: userDetail } = await fetchUserDetail(row.id);
      if (!userDetail) {
        message.error($t('page.userManagement.getDetailFailed'));
        return;
      }

      const formData: UserFormData = {
        username: userDetail.username,
        email: userDetail.email,
        password: '',
        verificationCode: '',
        roleIds: userDetail.roles?.map(r => r.id) ?? [],
        avatar: userDetail.avatar ?? ''
      };

      await userDialog.showUserForm({
        isEdit: true,
        formData,
        roleOptions: roleOptions.value,
        onConfirm: async (form: UserFormData) => {
          const updateData: Api.UserManagement.UpdateUserRequest = {
            username: form.username,
            email: form.email
          };
          if (form.password) {
            updateData.password = form.password;
          }
          if (form.avatar) {
            updateData.avatar = form.avatar;
          }
          const { error } = await fetchUpdateUser(row.id, updateData);
          if (error) return;

          message.success($t('common.updateSuccess'));
          await refreshPage();
          return true;
        }
      });
    }

    async function handleAssignRoles(row: User) {
      closeDetailDrawer();

      const { data: userDetail } = await fetchUserDetail(row.id);
      if (!userDetail) {
        message.error($t('page.userManagement.getDetailFailed'));
        return;
      }

      await userRoleDialog.showUserRole({
        userId: row.id,
        username: userDetail.username,
        roleIds: userDetail.roles?.map(r => r.id) ?? [],
        roleOptions: roleOptions.value,
        onConfirm: async (roleIds: number[]) => {
          const { error } = await fetchAssignUserRoles(row.id, { roleIds });
          if (error) return;

          message.success($t('page.userManagement.assignRolesSuccess'));
          message.info($t('page.userManagement.reloginHint'));
          await refreshPage();
          return true;
        }
      });
    }

    async function handleBlacklist(row: User) {
      closeDetailDrawer();

      await dialog.confirm({
        title: $t('page.userManagement.blacklist'),
        content: $t('page.userManagement.confirmBlacklist', { username: row.username }),
        type: 'warning',
        confirmText: $t('page.userManagement.blacklist'),
        onConfirm: async () => {
          const { error } = await fetchBlacklistUser(row.id);
          if (error) return;

          message.success($t('page.userManagement.blacklistSuccess'));
          await refreshPage();
        }
      });
    }

    async function handleUnblacklist(row: User) {
      closeDetailDrawer();

      await dialog.confirm({
        title: $t('page.userManagement.unblacklist'),
        content: $t('page.userManagement.confirmUnblacklist', { username: row.username }),
        type: 'info',
        onConfirm: async () => {
          const { error } = await fetchUnblacklistUser(row.id);
          if (error) return;

          message.success($t('page.userManagement.unblacklistSuccess'));
          await refreshPage();
        }
      });
    }

    async function handleKick(row: User) {
      closeDetailDrawer();

      await dialog.confirm({
        title: $t('page.userManagement.kickOffline'),
        content: $t('page.userManagement.kickOfflineConfirm', { username: row.username }),
        type: 'warning',
        onConfirm: async () => {
          const { error } = await fetchKickUser(row.id);
          if (error) return;

          message.success($t('page.userManagement.kickOfflineSuccess'));
          await refreshPage();
        }
      });
    }

    async function handleToggleStatus(userId: number, isActive: boolean) {
      const { error } = await fetchBatchUpdateUserStatus({ userIds: [userId], isActive });
      if (error) return;

      message.success($t('page.userManagement.toggleStatusSuccess'));
      await refreshPage();
    }

    async function handleDelete(row: User) {
      closeDetailDrawer();

      await dialog.confirmDelete(row.username, async () => {
        const { error } = await fetchDeleteUser(row.id);
        if (error) return;

        message.success($t('common.deleteSuccess'));
        await refreshPage();
      });
    }

    async function handleBatchDelete() {
      if (selectedRowKeys.value.length === 0) {
        message.warning($t('page.userManagement.selectUsersToDelete'));
        return;
      }
      await dialog.confirmDelete(
        $t('page.userManagement.confirmBatchDelete', { count: selectedRowKeys.value.length }),
        async () => {
          const { error } = await fetchBatchDeleteUsers({ userIds: selectedRowKeys.value });
          if (error) return;

          message.success($t('page.userManagement.batchDeleteSuccess'));
          selectedRowKeys.value = [];
          await refreshPage();
        }
      );
    }

    async function handleBatchStatus(isActive: boolean) {
      if (selectedRowKeys.value.length === 0) {
        message.warning($t('page.userManagement.selectUsersForBatch'));
        return;
      }

      const { error } = await fetchBatchUpdateUserStatus({
        userIds: selectedRowKeys.value,
        isActive
      });
      if (error) return;

      message.success($t('page.userManagement.batchStatusSuccess'));
      selectedRowKeys.value = [];
      await refreshPage();
    }

    async function handleBatchBlacklist() {
      if (selectedRowKeys.value.length === 0) {
        message.warning($t('page.userManagement.selectUsersForBatch'));
        return;
      }

      await blacklistDialog.showBlacklistReason({
        userCount: selectedRowKeys.value.length,
        onConfirm: async (reason: string) => {
          const { error } = await fetchBatchBlacklistUsers({
            userIds: selectedRowKeys.value,
            reason
          });
          if (error) return;

          message.success($t('page.userManagement.batchBlacklistSuccess'));
          selectedRowKeys.value = [];
          await refreshPage();
          return true;
        }
      });
    }

    onMounted(() => {
      loadRoles();
      loadStats();
    });

    const searchConfig = computed(() => createUserSearchFields(roles.value));

    const tableColumns = computed(() =>
      createUserTableColumns({
        onDetail: openUserDetail,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onToggleStatus: handleToggleStatus,
        onAssignRoles: handleAssignRoles,
        onBlacklist: handleBlacklist,
        onUnblacklist: handleUnblacklist,
        onKick: handleKick
      })
    );

    watch(
      tableColumns,
      cols => {
        columnChecks.value = mergeTablePageColumnChecks(cols, columnChecks.value);
      },
      { immediate: true, deep: true }
    );

    const detailDrawerConfig = computed(() =>
      detailUser.value
        ? {
            user: detailUser.value,
            onEdit: () => handleEdit(detailUser.value!),
            onAssignRoles: () => handleAssignRoles(detailUser.value!),
            onBlacklist: () => handleBlacklist(detailUser.value!),
            onUnblacklist: () => handleUnblacklist(detailUser.value!),
            onKick: () => handleKick(detailUser.value!)
          }
        : null
    );

    return () => (
      <div class="h-full flex flex-col">
        <TablePage
          class="min-h-0 flex-1"
          enableColumnSetting={true}
          columnChecks={columnChecks.value}
          onUpdateColumnChecks={next => {
            columnChecks.value = next;
          }}
          searchConfig={searchConfig.value}
          searchModel={searchParams}
          onSearch={onSearch}
          onReset={onReset}
          columns={tableColumns.value}
          data={data.value}
          loading={loading.value}
          pagination={pagination}
          selectedKeys={selectedRowKeys.value}
          onUpdateSelectedKeys={keys => {
            selectedRowKeys.value = keys as number[];
          }}
          rowKey="id"
          scrollX={USER_LIST_SCROLL_X}
          searchLabelWidth={96}
          searchCardBordered={false}
          actionCardBordered={false}
        >
          {{
            action: () => (
              <UserManagementToolbar
                stats={userStats.value}
                statsLoading={statsLoading.value}
                selectedCount={selectedRowKeys.value.length}
                exportLoading={exportLoading.value}
                columnChecks={columnChecks.value}
                onUpdate:columnChecks={next => {
                  columnChecks.value = next;
                }}
                onAdd={handleAdd}
                onRefresh={refreshPage}
                onExport={handleExport}
                onBatchEnable={() => handleBatchStatus(true)}
                onBatchDisable={() => handleBatchStatus(false)}
                onBatchBlacklist={handleBatchBlacklist}
                onBatchDelete={handleBatchDelete}
                onShowOnlineUsers={handleShowOnlineUsers}
              />
            )
          }}
        </TablePage>
        <UserDetailDrawer
          show={detailDrawerVisible.value}
          config={detailDrawerConfig.value}
          onUpdate:show={(val: boolean) => {
            detailDrawerVisible.value = val;
          }}
        />
      </div>
    );
  }
});
