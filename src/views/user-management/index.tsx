import { computed, defineComponent, getCurrentInstance, onMounted, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { useMessage } from 'naive-ui';
import {
  fetchActivateUser,
  fetchAdminRoleOptions,
  fetchAssignUserRoles,
  fetchBatchBlacklistUsers,
  fetchBatchDeleteUsers,
  fetchBatchUpdateUserStatus,
  fetchBlacklistUser,
  fetchCreateUser,
  fetchDeactivateUser,
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
import type { ActionBarConfig } from '@/components/table-page/types';
import { useAdminListTable } from '@/components/table-page/hooks';
import { mergeTablePageColumnChecks } from '@/components/table-page/utils/columnChecks';
import { $t } from '@/locales';
import { encryptLoginPassword } from '@/views/_builtin/login/shared/utils';
import { useDialog } from '@/components/base-dialog/useDialog';
import type { UserDetailDrawerConfig, UserFormData } from './components/dialog';
import { useBlacklistDialog } from './components/useBlacklistDialog';
import { useOnlineUsersDialog } from './components/useOnlineUsersDialog';
import { useUserDialog } from './components/useUserDialog';
import { useUserDetailDrawer } from './components/useUserDetailDrawer';
import { useUserRoleDialog } from './components/useUserRoleDialog';
import { useUserStatusDialog } from './components/useUserStatusDialog';
import UserStatsInline from './components/UserStatsInline';
import { USER_LIST_SCROLL_X, createUserSearchFields, createUserTableColumns } from './listUiConfig';

type User = Api.UserManagement.User;

function createEmptyUserForm(): UserFormData {
  return {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
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
    const userStatusDialog = useUserStatusDialog();
    const dialog = useDialog(instance?.appContext.app);

    async function loadUserDetail(userId: number): Promise<User | null> {
      const { data, error } = await fetchUserDetail(userId);
      if (error || !data) {
        message.error($t('page.userManagement.getDetailFailed'));
        return null;
      }
      return data;
    }

    let buildDetailConfig: (user: User) => UserDetailDrawerConfig;

    const detailDrawer = useUserDetailDrawer({
      loadUser: loadUserDetail,
      getBuildConfig: () => buildDetailConfig
    });

    const selectedRowKeys = ref<number[]>([]);
    const roles = ref<Api.UserManagement.Role[]>([]);
    const userStats = ref<Api.UserManagement.UserStats | null>(null);
    const statsLoading = ref(false);
    const exportLoading = ref(false);
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
      await detailDrawer.syncIfOpen();
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

    async function openUserDetail(row: User) {
      const user = await loadUserDetail(row.id);
      if (!user) return;
      await detailDrawer.open(user);
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
            password: encryptLoginPassword(form.password),
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
      const userDetail = await loadUserDetail(row.id);
      if (!userDetail) return;

      const formData: UserFormData = {
        username: userDetail.username,
        email: userDetail.email,
        password: '',
        confirmPassword: '',
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
            const encryptedPassword = encryptLoginPassword(form.password);
            updateData.password = encryptedPassword;
            updateData.confirmPassword = encryptedPassword;
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
      const userDetail = await loadUserDetail(row.id);
      if (!userDetail) return;

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

    async function activateUser(row: User) {
      const { error } = await fetchActivateUser(row.id);
      if (error) {
        await getData();
        return false;
      }

      message.success($t('page.userManagement.activateSuccess'));
      await refreshPage();
      return true;
    }

    async function deactivateUser(row: User, reason?: string) {
      const { error } = await fetchDeactivateUser(row.id, reason ? { reason } : undefined);
      if (error) return false;

      message.success($t('page.userManagement.deactivateSuccess'));
      await refreshPage();
      return true;
    }

    async function promptDeactivate(
      row: User,
      options?: { onCancel?: () => void; revertOnFailure?: () => void }
    ) {
      await userStatusDialog.showStatusReason({
        title: $t('page.userManagement.deactivate'),
        description: $t('page.userManagement.confirmDeactivate', { username: row.username }),
        confirmType: 'warning',
        onCancel: options?.onCancel,
        onConfirm: async reason => {
          const succeeded = await deactivateUser(row, reason);
          if (!succeeded) {
            options?.revertOnFailure?.();
            return;
          }
          return true;
        }
      });
    }

    async function handleToggleStatus(row: User, isActive: boolean) {
      if (isActive) {
        await activateUser(row);
        return;
      }

      await promptDeactivate(row, {
        onCancel: () => getData(),
        revertOnFailure: () => getData()
      });
    }

    buildDetailConfig = user => ({
      user,
      onEdit: () => handleEdit(user),
      onAssignRoles: () => handleAssignRoles(user),
      onActivate: () => activateUser(user),
      onDeactivate: () => promptDeactivate(user),
      onBlacklist: () => handleBlacklist(user),
      onUnblacklist: () => handleUnblacklist(user),
      onKick: () => handleKick(user)
    });

    async function handleDelete(row: User) {
      detailDrawer.close();

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

      const userIds = [...selectedRowKeys.value];

      if (isActive) {
        const { error } = await fetchBatchUpdateUserStatus({ userIds, isActive: true });
        if (error) return;

        message.success($t('page.userManagement.batchStatusSuccess'));
        selectedRowKeys.value = [];
        await refreshPage();
        return;
      }

      await userStatusDialog.showStatusReason({
        title: $t('page.userManagement.batchDisable'),
        userCount: userIds.length,
        confirmType: 'warning',
        onConfirm: async reason => {
          const { error } = await fetchBatchUpdateUserStatus({
            userIds,
            isActive: false,
            reason: reason || undefined
          });
          if (error) return;

          message.success($t('page.userManagement.batchStatusSuccess'));
          selectedRowKeys.value = [];
          await refreshPage();
          return true;
        }
      });
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

    function handleToolbarBatchSelect(key: string) {
      switch (key) {
        case 'enable':
          handleBatchStatus(true);
          break;
        case 'disable':
          handleBatchStatus(false);
          break;
        case 'blacklist':
          handleBatchBlacklist();
          break;
        case 'delete':
          handleBatchDelete();
          break;
        default:
          break;
      }
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
        onActivate: activateUser,
        onDeactivate: promptDeactivate,
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

    const actionConfig = computed<ActionBarConfig>(() => {
      const selectedCount = selectedRowKeys.value.length;
      const hasSelection = selectedCount > 0;

      return {
        showStats: true,
        statsRender: () => (
          <UserStatsInline
            stats={userStats.value}
            loading={statsLoading.value}
            onClickOnline={handleShowOnlineUsers}
          />
        ),
        preset: {
          add: { onClick: handleAdd },
          refresh: { onClick: refreshPage }
        },
        dropdowns: [
          {
            label: $t('page.userManagement.batchOperations'),
            icon: 'carbon:list-checked',
            secondary: true,
            disabled: !hasSelection,
            badge: hasSelection ? selectedCount : undefined,
            options: [
              {
                label: $t('page.userManagement.batchEnable'),
                key: 'enable',
                disabled: !hasSelection
              },
              {
                label: $t('page.userManagement.batchDisable'),
                key: 'disable',
                disabled: !hasSelection
              },
              {
                label: $t('page.userManagement.batchBlacklist'),
                key: 'blacklist',
                disabled: !hasSelection
              },
              { key: 'batch-divider', type: 'divider' },
              {
                label: $t('common.batchDelete'),
                key: 'delete',
                disabled: !hasSelection
              }
            ],
            onSelect: handleToolbarBatchSelect
          },
          {
            label: $t('common.export'),
            icon: 'carbon:download',
            loading: exportLoading.value,
            options: [
              { label: $t('page.userManagement.exportCsv'), key: 'csv' },
              { label: $t('page.userManagement.exportExcel'), key: 'xlsx' }
            ],
            onSelect: (key: string) => {
              if (key === 'csv' || key === 'xlsx') {
                handleExport(key);
              }
            }
          }
        ]
      };
    });

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
          actionConfig={actionConfig.value}
        />
      </div>
    );
  }
});
