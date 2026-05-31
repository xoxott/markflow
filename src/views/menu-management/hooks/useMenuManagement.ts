import type { App } from 'vue';
import { computed, getCurrentInstance, onMounted, ref, shallowRef } from 'vue';
import { useMessage } from 'naive-ui';
import {
  fetchCreateMenu,
  fetchDeleteMenu,
  fetchMenuTree,
  fetchMoveMenu,
  fetchSyncRoutes,
  fetchToggleMenuStatus,
  fetchUpdateMenu
} from '@/service/api/menu';
import { buildSyncRegistryPayload } from '@/service/menu/route-registry-sync';
import { useRouteStore } from '@/store/modules/route';
import { useDialog } from '@/components/base-dialog/useDialog';
import { $t } from '@/locales';
import type { MenuFormData } from '../components/dialog';
import { useMenuDialog } from '../components/useMenuDialog';
import type { MenuTreeStats } from '../constants';
import type { MenuTreeNode } from '../types';
import {
  canDropMenu,
  collectTreeStats,
  filterMenuTree,
  findMenuNode,
  flattenGroupOptions
} from '../utils/menu-tree';
import {
  createDefaultFormData,
  formDataToCreateRequest,
  formDataToUpdateRequest,
  menuNodeToFormData
} from '../utils/menu-form';
import { useRouteRegistry } from './useRouteRegistry';

export interface UseMenuManagementOptions {
  app?: App;
}

function formatSyncSuccessMessage(stats: Api.MenuManagement.SyncRoutesResult | null | undefined) {
  return $t('page.menuManagement.syncSuccess', {
    menusCreated: stats?.menusCreated ?? 0,
    menusUpdated: stats?.menusUpdated ?? 0,
    registryCreated: stats?.registryCreated ?? 0,
    registryUpdated: stats?.registryUpdated ?? 0,
    skipped: stats?.skipped ?? 0
  });
}

export function useMenuManagement(options: UseMenuManagementOptions = {}) {
  const message = useMessage();
  const routeStore = useRouteStore();
  const instance = getCurrentInstance();
  const app = options.app ?? instance?.appContext.app;
  const dialog = useDialog(app);
  const menuDialog = useMenuDialog(app);
  const { routeKeyOptions, getRegistryItem } = useRouteRegistry();

  const loading = ref(false);
  const syncing = ref(false);
  const treeData = shallowRef<MenuTreeNode[]>([]);
  const selectedKey = ref<string | null>(null);
  const searchKeyword = ref('');

  const filteredTree = computed(() => filterMenuTree(treeData.value, searchKeyword.value));
  const selectedNode = computed(() =>
    selectedKey.value ? findMenuNode(treeData.value, selectedKey.value) : null
  );
  const selectedRegistryItem = computed(() =>
    getRegistryItem(selectedNode.value?.routeKey ?? undefined)
  );
  const parentOptions = computed(() =>
    flattenGroupOptions(treeData.value, selectedKey.value ?? undefined)
  );
  const stats = computed<MenuTreeStats>(() => collectTreeStats(treeData.value));

  const loadTree = async () => {
    loading.value = true;
    try {
      const result = await fetchMenuTree();
      treeData.value = result.data ?? [];
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : $t('page.menuManagement.loadFailed'));
    } finally {
      loading.value = false;
    }
  };

  const applyRoutes = async () => {
    await routeStore.reloadAuthRoutes();
  };

  const persistAndRefresh = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      message.success(successMessage);
      await loadTree();
      await applyRoutes();
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : $t('page.menuManagement.saveFailed'));
      throw error;
    }
  };

  const openForm = async (params: {
    isEdit: boolean;
    formData: MenuFormData;
    menuId?: string;
    title?: string;
  }) => {
    await menuDialog.showMenuForm({
      isEdit: params.isEdit,
      title: params.title,
      formData: params.formData,
      parentOptions: parentOptions.value,
      menuTreeData: treeData.value,
      routeKeyOptions: routeKeyOptions.value,
      excludeSidebarKey: params.menuId
        ? findMenuNode(treeData.value, params.menuId)?.sidebarKey
        : undefined,
      excludeMenuId: params.menuId,
      onConfirm: async (data: MenuFormData) => {
        if (params.isEdit && params.menuId) {
          await persistAndRefresh(
            () => fetchUpdateMenu(params.menuId!, formDataToUpdateRequest(data)),
            $t('common.updateSuccess')
          );
        } else {
          await persistAndRefresh(
            () => fetchCreateMenu(formDataToCreateRequest(data)),
            $t('common.addSuccess')
          );
        }
      }
    });
  };

  const handleAddRoot = () => {
    openForm({
      isEdit: false,
      formData: createDefaultFormData(null),
      title: $t('page.menuManagement.addRoot')
    });
  };

  const handleAddChild = (parentId: string) => {
    openForm({
      isEdit: false,
      formData: createDefaultFormData(parentId),
      title: $t('page.menuManagement.addChild')
    });
  };

  const handleEdit = (id: string) => {
    selectedKey.value = id;
    const node = findMenuNode(treeData.value, id);
    openForm({
      isEdit: true,
      menuId: id,
      formData: menuNodeToFormData(node),
      title: $t('page.menuManagement.editMenu')
    });
  };

  const handleDelete = (id: string) => {
    const node = findMenuNode(treeData.value, id);
    dialog.confirm({
      title: $t('common.confirmDelete'),
      content: $t('page.menuManagement.confirmDelete', { name: node?.name ?? id }),
      type: 'warning',
      confirmText: $t('common.delete'),
      onConfirm: async () => {
        try {
          await fetchDeleteMenu(id);
          message.success($t('common.deleteSuccess'));
          if (selectedKey.value === id) selectedKey.value = null;
          await loadTree();
          await applyRoutes();
        } catch (error: unknown) {
          message.error(
            error instanceof Error ? error.message : $t('page.menuManagement.deleteFailed')
          );
        }
      }
    });
  };

  const handleToggleStatus = async (id: string) => {
    const node = findMenuNode(treeData.value, id);
    if (!node) return;
    try {
      await fetchToggleMenuStatus(id, !node.isActive);
      message.success($t('page.menuManagement.statusUpdated'));
      await loadTree();
      await applyRoutes();
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : $t('page.menuManagement.saveFailed'));
    }
  };

  const handleSyncRoutes = () => {
    if (syncing.value) return;
    dialog.confirm({
      title: $t('page.menuManagement.syncRoutes'),
      content: $t('page.menuManagement.syncConfirm'),
      type: 'info',
      confirmText: $t('page.menuManagement.syncOverwrite'),
      cancelText: $t('page.menuManagement.syncAddOnly'),
      onConfirm: async () => {
        syncing.value = true;
        try {
          const result = await fetchSyncRoutes({
            overwrite: true,
            registry: buildSyncRegistryPayload()
          });
          message.success(formatSyncSuccessMessage(result.data));
          await loadTree();
          await applyRoutes();
        } catch (error: unknown) {
          message.error(
            error instanceof Error ? error.message : $t('page.menuManagement.syncFailed')
          );
        } finally {
          syncing.value = false;
        }
      },
      onCancel: async () => {
        syncing.value = true;
        try {
          const result = await fetchSyncRoutes({
            overwrite: false,
            registry: buildSyncRegistryPayload()
          });
          message.success(formatSyncSuccessMessage(result.data));
          await loadTree();
          await applyRoutes();
        } catch (error: unknown) {
          message.error(
            error instanceof Error ? error.message : $t('page.menuManagement.syncFailed')
          );
        } finally {
          syncing.value = false;
        }
      }
    });
  };

  const handleDrop = async (payload: {
    dragId: string;
    targetId: string;
    position: 'before' | 'inside' | 'after';
  }) => {
    const { dragId, targetId, position } = payload;
    if (!canDropMenu(treeData.value, dragId, targetId, position)) return;

    try {
      await fetchMoveMenu(dragId, { targetId, position });
      message.success($t('page.menuManagement.moveSuccess'));
      await loadTree();
      await applyRoutes();
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : $t('page.menuManagement.moveFailed'));
    }
  };

  onMounted(loadTree);

  return {
    loading,
    syncing,
    treeData,
    filteredTree,
    selectedKey,
    selectedNode,
    selectedRegistryItem,
    searchKeyword,
    stats,
    handleAddRoot,
    handleAddChild,
    handleEdit,
    handleDelete,
    handleToggleStatus,
    handleSyncRoutes,
    handleDrop
  };
}

export type UseMenuManagementReturn = ReturnType<typeof useMenuManagement>;
