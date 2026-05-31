import { defineComponent } from 'vue';
import { NCard } from 'naive-ui';
import { $t } from '@/locales';
import MenuDetailPanel from './components/MenuDetailPanel';
import MenuPageHeader from './components/MenuPageHeader';
import MenuTreePanel from './components/MenuTreePanel';
import { useMenuManagement } from './hooks/useMenuManagement';
import './styles/menu-management.scss';

export default defineComponent({
  name: 'MenuManagement',
  setup() {
    const {
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
    } = useMenuManagement();

    return () => (
      <div class="menu-management min-h-0 flex flex-col flex-1 gap-12px">
        <MenuPageHeader stats={stats.value} />

        <div class="menu-management__layout">
          <NCard
            bordered={false}
            class="menu-management__panel menu-management__panel--tree h-full card-wrapper"
          >
            {{
              header: () => (
                <span class="menu-management__panel-title">
                  {$t('page.menuManagement.treeTitle')}
                </span>
              ),
              default: () => (
                <MenuTreePanel
                  treeData={filteredTree.value}
                  pathTreeData={treeData.value}
                  loading={loading.value}
                  syncing={syncing.value}
                  selectedKey={selectedKey.value}
                  searchKeyword={searchKeyword.value}
                  onSync={handleSyncRoutes}
                  onUpdate:searchKeyword={(val: string) => {
                    searchKeyword.value = val;
                  }}
                  onSelect={(key: string | null) => {
                    selectedKey.value = key;
                  }}
                  onAdd-root={handleAddRoot}
                  onAdd-child={handleAddChild}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle-status={handleToggleStatus}
                  onDrop={handleDrop}
                />
              )
            }}
          </NCard>

          <MenuDetailPanel
            node={selectedNode.value}
            treeData={treeData.value}
            registryItem={selectedRegistryItem.value}
            onSelect={(id: string) => {
              searchKeyword.value = '';
              selectedKey.value = id;
            }}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggle-status={handleToggleStatus}
            onAdd-child={handleAddChild}
          />
        </div>
      </div>
    );
  }
});
