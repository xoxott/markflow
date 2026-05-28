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
      applying,
      treeData,
      filteredTree,
      selectedKey,
      selectedNode,
      searchKeyword,
      stats,
      loadTree,
      applyRoutes,
      handleAddRoot,
      handleAddChild,
      handleEdit,
      handleDelete,
      handleToggleStatus,
      handleSyncRoutes,
      handleDrop
    } = useMenuManagement();

    return () => (
      <div class="menu-management h-full flex flex-col gap-16px">
        <MenuPageHeader
          loading={loading.value}
          applying={applying.value}
          stats={stats.value}
          onSync={handleSyncRoutes}
          onRefresh={loadTree}
          onApply={() => applyRoutes()}
        />

        <div class="menu-management__layout">
          <NCard bordered={false} class="menu-management__panel h-full card-wrapper">
            {{
              header: () => (
                <span class="menu-management__panel-title">
                  {$t('page.menuManagement.treeTitle')}
                </span>
              ),
              default: () => (
                <MenuTreePanel
                  treeData={filteredTree.value}
                  loading={loading.value}
                  selectedKey={selectedKey.value}
                  searchKeyword={searchKeyword.value}
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
