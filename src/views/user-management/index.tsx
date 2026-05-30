import { computed, defineComponent, getCurrentInstance, onMounted, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import {
  fetchAssignUserPermission,
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
  fetchRevokeUserPermission,
  fetchUnblacklistUser,
  fetchUpdateUser,
  fetchUpdateUserStatus,
  fetchUserDetail,
  fetchUserEffectivePermissions,
  fetchUserList,
  fetchUserStats
} from '@/service/api/user';
import { useAdminOptionStore } from '@/store/modules/admin-option';
import { parseQueryNumber } from '@/hooks/common/useRouteQueryFilters';
import { useRouterPush } from '@/hooks/common/router';
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
import { useUserDirectPermissionDialog } from './components/useUserDirectPermissionDialog';
import { useUserStatusDialog } from './components/useUserStatusDialog';
import UserStatsInline from './components/UserStatsInline';
import { USER_LIST_SCROLL_X, createUserSearchFields, createUserTableColumns } from './listUiConfig';
import { filterManageableUserIds, isUserManageable } from './utils/userManageability';
import { excludeExistingPermissionIds, pickDirectPermissions } from './utils/effectivePermissions';

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
    const userDialog = useUserDialog(instance?.appContext.app);
    const userRoleDialog = useUserRoleDialog(instance?.appContext.app);
    const userDirectPermissionDialog = useUserDirectPermissionDialog(instance?.appContext.app);
    const blacklistDialog = useBlacklistDialog();
    const onlineUsersDialog = useOnlineUsersDialog();
    const userStatusDialog = useUserStatusDialog();
    const dialog = useDialog(instance?.appContext.app);
    const adminOptionStore = useAdminOptionStore();
    const { routerPushByKey } = useRouterPush();
    const permissionsRefreshKey = ref(0);

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
    const userStats = ref<Api.UserManagement.UserStats | null>(null);
    const statsLoading = ref(false);
    const exportLoading = ref(false);
    const columnChecks = ref<NaiveUI.TableColumnCheck[]>([]);

    const { data, loading, pagination, getData, searchParams, onSearch, onReset } =
      useAdminListTable({
        apiFn: fetchUserList,
        listFilters: {
          search: '',
          isActive: undefined,
          isOnline: undefined,
          isBlacklisted: undefined,
          roleId: undefined,
          sortBy: undefined as string | undefined,
          sortOrder: undefined as 'asc' | 'desc' | undefined
        },
        showTotal: true,
        routeQuery: {
          mapping: {
            roleId: { field: 'roleId', parse: parseQueryNumber },
            search: { field: 'search' }
          }
        }
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

    function invalidateUserOptions() {
      adminOptionStore.invalidateResource('users');
    }

    function warnNotManageable() {
      message.warning($t('page.userManagement.notManageable'));
    }

    function resolveManageableBatchIds(): number[] | null {
      const manageableIds = filterManageableUserIds(data.value ?? [], selectedRowKeys.value);

      if (manageableIds.length === 0) {
        message.warning($t('page.userManagement.batchAllUnmanageable'));
        return null;
      }

      const skippedCount = selectedRowKeys.value.length - manageableIds.length;
      if (skippedCount > 0) {
        message.warning($t('page.userManagement.batchSkipUnmanageable', { count: skippedCount }));
      }

      return manageableIds;
    }

    function buildExportParams(format: Api.UserManagement.ExportFormat) {
      const params = searchParams as Api.UserManagement.UserListParams;
      return {
        format,
        search: params.search,
        isActive: params.isActive,
        isOnline: params.isOnline,
        isBlacklisted: params.isBlacklisted,
        roleId: params.roleId,
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
        users: onlineUsers ?? [],
        onKick: handleKick
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
          invalidateUserOptions();
          await refreshPage();
          return true;
        }
      });
    }

    async function handleEdit(row: User) {
      if (!isUserManageable(row)) {
        warnNotManageable();
        return;
      }

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
          invalidateUserOptions();
          await refreshPage();
          return true;
        }
      });
    }

    async function handleAssignRoles(row: User) {
      if (!isUserManageable(row)) {
        warnNotManageable();
        return;
      }

      const userDetail = await loadUserDetail(row.id);
      if (!userDetail) return;

      await userRoleDialog.showUserRole({
        userId: row.id,
        username: userDetail.username,
        roleIds: userDetail.roles?.map(r => r.id) ?? [],
        roles: userDetail.roles ?? [],
        onConfirm: async (roleIds: number[]) => {
          const { error } = await fetchAssignUserRoles(row.id, { roleIds });
          if (error) return;

          message.success($t('page.userManagement.assignRolesSuccess'));
          message.info($t('page.userManagement.reloginHint'));
          adminOptionStore.invalidateResource('roles');
          permissionsRefreshKey.value += 1;
          await refreshPage();
          return true;
        }
      });
    }

    async function handleAssignDirectPermissions(row: User) {
      if (!isUserManageable(row)) {
        warnNotManageable();
        return;
      }

      const { data: effectiveData } = await fetchUserEffectivePermissions(row.id);
      const assignedDirectPermissions = pickDirectPermissions(effectiveData?.data ?? []);

      await userDirectPermissionDialog.showUserDirectPermission({
        userId: row.id,
        username: row.username,
        assignedDirectPermissions,
        onConfirm: async permissionIds => {
          const newIds = excludeExistingPermissionIds(
            permissionIds,
            assignedDirectPermissions.map(item => item.permissionId)
          );

          if (newIds.length === 0) {
            message.warning($t('page.userManagement.noNewDirectPermissions'));
            return false;
          }

          for (const permissionId of newIds) {
            const { error } = await fetchAssignUserPermission(row.id, { permissionId });
            if (error) return false;
          }

          message.success($t('page.userManagement.assignDirectPermissionsSuccess'));
          adminOptionStore.invalidateResource('permissions');
          permissionsRefreshKey.value += 1;
          await detailDrawer.syncIfOpen();
          return true;
        }
      });
    }

    async function handleRevokeDirectPermission(row: User, permissionId: number) {
      if (!isUserManageable(row)) {
        warnNotManageable();
        return;
      }

      const { error } = await fetchRevokeUserPermission(row.id, permissionId);
      if (error) return;

      message.success($t('page.userManagement.revokeDirectPermissionSuccess'));
      adminOptionStore.invalidateResource('permissions');
      permissionsRefreshKey.value += 1;
      await detailDrawer.syncIfOpen();
    }

    function navigateToRole(_roleId: number, roleName: string) {
      routerPushByKey('role-management', { query: { search: roleName } });
    }

    async function handleBlacklist(row: User) {
      if (!isUserManageable(row)) {
        warnNotManageable();
        return;
      }

      await dialog.confirm({
        title: $t('page.userManagement.blacklist'),
        content: $t('page.userManagement.confirmBlacklist', { username: row.username }),
        type: 'warning',
        confirmText: $t('page.userManagement.blacklist'),
        onConfirm: async () => {
          const { error } = await fetchBlacklistUser(row.id);
          if (error) return;

          message.success($t('page.userManagement.blacklistSuccess'));
          invalidateUserOptions();
          await refreshPage();
        }
      });
    }

    async function handleUnblacklist(row: User) {
      if (!isUserManageable(row)) {
        warnNotManageable();
        return;
      }

      await dialog.confirm({
        title: $t('page.userManagement.unblacklist'),
        content: $t('page.userManagement.confirmUnblacklist', { username: row.username }),
        type: 'info',
        onConfirm: async () => {
          const { error } = await fetchUnblacklistUser(row.id);
          if (error) return;

          message.success($t('page.userManagement.unblacklistSuccess'));
          invalidateUserOptions();
          await refreshPage();
        }
      });
    }

    async function handleKick(row: User) {
      if (!isUserManageable(row)) {
        warnNotManageable();
        return;
      }

      await dialog.confirm({
        title: $t('page.userManagement.kickOffline'),
        content: $t('page.userManagement.kickOfflineConfirm', { username: row.username }),
        type: 'warning',
        onConfirm: async () => {
          const { data: kickResult, error } = await fetchKickUser(row.id);
          if (error) return;

          message.success(kickResult?.message ?? $t('page.userManagement.kickOfflineSuccess'));
          await refreshPage();
        }
      });
    }

    async function activateUser(row: User) {
      if (!isUserManageable(row)) {
        warnNotManageable();
        return false;
      }

      const { error } = await fetchUpdateUserStatus(row.id, { isActive: true });
      if (error) {
        await getData();
        return false;
      }

      message.success($t('page.userManagement.activateSuccess'));
      invalidateUserOptions();
      await refreshPage();
      return true;
    }

    async function deactivateUser(row: User, reason?: string) {
      if (!isUserManageable(row)) {
        warnNotManageable();
        return false;
      }

      const { error } = await fetchUpdateUserStatus(row.id, {
        isActive: false,
        reason: reason || undefined
      });
      if (error) return false;

      message.success($t('page.userManagement.deactivateSuccess'));
      invalidateUserOptions();
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
      if (!isUserManageable(row)) {
        warnNotManageable();
        await getData();
        return;
      }

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
      permissionsRefreshKey: permissionsRefreshKey.value,
      onEdit: () => handleEdit(user),
      onAssignRoles: () => handleAssignRoles(user),
      onAssignDirectPermissions: () => handleAssignDirectPermissions(user),
      onRevokeDirectPermission: permissionId => handleRevokeDirectPermission(user, permissionId),
      onRoleClick: (roleId, roleName) => navigateToRole(roleId, roleName),
      onActivate: () => activateUser(user),
      onDeactivate: () => promptDeactivate(user),
      onBlacklist: () => handleBlacklist(user),
      onUnblacklist: () => handleUnblacklist(user),
      onKick: () => handleKick(user)
    });

    async function handleDelete(row: User) {
      if (!isUserManageable(row)) {
        warnNotManageable();
        return;
      }

      detailDrawer.close();

      await dialog.confirmDelete(row.username, async () => {
        const { error } = await fetchDeleteUser(row.id);
        if (error) return;

        message.success($t('common.deleteSuccess'));
        invalidateUserOptions();
        await refreshPage();
      });
    }

    async function handleBatchDelete() {
      if (selectedRowKeys.value.length === 0) {
        message.warning($t('page.userManagement.selectUsersToDelete'));
        return;
      }

      const userIds = resolveManageableBatchIds();
      if (!userIds) {
        return;
      }

      await dialog.confirmDelete(
        $t('page.userManagement.confirmBatchDelete', { count: userIds.length }),
        async () => {
          const { error } = await fetchBatchDeleteUsers({ userIds });
          if (error) return;

          message.success($t('page.userManagement.batchDeleteSuccess'));
          invalidateUserOptions();
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

      const userIds = resolveManageableBatchIds();
      if (!userIds) {
        return;
      }

      if (isActive) {
        const { error } = await fetchBatchUpdateUserStatus({ userIds, isActive: true });
        if (error) return;

        message.success($t('page.userManagement.batchStatusSuccess'));
        invalidateUserOptions();
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
          invalidateUserOptions();
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

      const userIds = resolveManageableBatchIds();
      if (!userIds) {
        return;
      }

      await blacklistDialog.showBlacklistReason({
        userCount: userIds.length,
        onConfirm: async (reason: string) => {
          const { error } = await fetchBatchBlacklistUsers({
            userIds,
            reason
          });
          if (error) return;

          message.success($t('page.userManagement.batchBlacklistSuccess'));
          invalidateUserOptions();
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
      loadStats();
    });

    const searchConfig = computed(() => createUserSearchFields());

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
