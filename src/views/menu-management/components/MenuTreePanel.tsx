import type { PropType } from 'vue';
import { computed, defineComponent, ref, watch } from 'vue';
import { NButton, NDropdown, NInput, NSpace, NSpin, NTag, NTooltip, NTree } from 'naive-ui';
import type { DropdownOption, TreeDropInfo, TreeOption } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon';
import { $t } from '@/locales';
import { MENU_TYPE_META } from '../constants';
import type { MenuTreeNode } from '../types';
import { getAllExpandableKeys, findMenuPath } from '../utils/menu-tree';
import MenuEmptyState from './MenuEmptyState';

export default defineComponent({
  name: 'MenuTreePanel',
  props: {
    treeData: { type: Array as PropType<MenuTreeNode[]>, default: () => [] },
    pathTreeData: { type: Array as PropType<MenuTreeNode[]>, default: undefined },
    loading: { type: Boolean, default: false },
    selectedKey: { type: String as PropType<string | null>, default: null },
    searchKeyword: { type: String, default: '' }
  },
  emits: [
    'select',
    'add-root',
    'add-child',
    'edit',
    'delete',
    'toggle-status',
    'drop',
    'update:searchKeyword'
  ],
  setup(props, { emit }) {
    const expandedKeys = ref<string[]>([]);

    watch(
      () => props.treeData,
      nodes => {
        if (!expandedKeys.value.length && nodes.length) {
          expandedKeys.value = getAllExpandableKeys(nodes);
        }
      },
      { immediate: true }
    );

    watch(
      () => props.selectedKey,
      key => {
        if (!key) return;
        const source = props.pathTreeData ?? props.treeData;
        if (!source.length) return;
        const path = findMenuPath(source, key);
        if (path.length <= 1) return;
        const ancestorKeys = path.slice(0, -1).map(node => node.id);
        expandedKeys.value = [...new Set([...expandedKeys.value, ...ancestorKeys])];
      }
    );

    const createOptions = computed<DropdownOption[]>(() => [
      {
        label: $t('page.menuManagement.addRoot'),
        key: 'root',
        icon: () => <SvgIcon icon="mdi:file-tree" class="text-16px" />
      },
      {
        label: $t('page.menuManagement.addChild'),
        key: 'child',
        disabled: !props.selectedKey,
        icon: () => <SvgIcon icon="mdi:file-tree-outline" class="text-16px" />
      }
    ]);

    const treeOptions = computed<TreeOption[]>(() => {
      const mapNodes = (nodes: MenuTreeNode[]): TreeOption[] =>
        nodes.map(node => {
          const typeMeta = MENU_TYPE_META[node.type];
          const icon = node.icon || typeMeta.icon;

          return {
            key: node.id,
            label: node.name,
            prefix: () => <SvgIcon icon={icon} class="menu-tree-node__icon" />,
            suffix: () => (
              <div onClick={(e: Event) => e.stopPropagation()}>
                <NSpace size={4} wrap={false}>
                  <NTag size="small" type={typeMeta.tagType} bordered={false}>
                    {typeMeta.label()}
                  </NTag>
                  {!node.isActive ? (
                    <NTag size="small" type="warning" bordered={false}>
                      {$t('page.menuManagement.inactive')}
                    </NTag>
                  ) : null}
                </NSpace>
              </div>
            ),
            children: node.children?.length ? mapNodes(node.children) : undefined
          };
        });

      return mapNodes(props.treeData);
    });

    const handleExpandAll = () => {
      expandedKeys.value = getAllExpandableKeys(props.treeData);
    };

    const handleCollapseAll = () => {
      expandedKeys.value = [];
    };

    const handleCreateSelect = (key: string) => {
      if (key === 'root') {
        emit('add-root');
        return;
      }
      if (key === 'child' && props.selectedKey) {
        emit('add-child', props.selectedKey);
      }
    };

    const handleDrop = ({ node, dragNode, dropPosition }: TreeDropInfo) => {
      if (!dragNode || !node) return;
      emit('drop', {
        dragId: String(dragNode.key),
        targetId: String(node.key),
        position: dropPosition
      });
    };

    const renderIconButton = (icon: string, title: string, onClick: () => void) => (
      <NTooltip>
        {{
          trigger: () => (
            <NButton
              size="small"
              quaternary
              class="menu-management__tree-icon-btn"
              onClick={onClick}
            >
              {{ icon: () => <SvgIcon icon={icon} class="text-16px" /> }}
            </NButton>
          ),
          default: () => title
        }}
      </NTooltip>
    );

    return () => (
      <div class="menu-management__panel-body">
        <div class="menu-management__tree-toolbar">
          <NInput
            value={props.searchKeyword}
            clearable
            placeholder={$t('page.menuManagement.searchPlaceholder')}
            onUpdateValue={(val: string) => emit('update:searchKeyword', val)}
          />

          <div class="menu-management__tree-toolbar-row">
            <NDropdown trigger="click" options={createOptions.value} onSelect={handleCreateSelect}>
              <NButton size="small" type="primary">
                {{
                  icon: () => <SvgIcon icon="mdi:plus" class="text-16px" />,
                  default: () => $t('page.menuManagement.addMenu')
                }}
              </NButton>
            </NDropdown>

            <div class="menu-management__tree-toolbar-actions">
              {renderIconButton(
                'mdi:unfold-more-horizontal',
                $t('page.menuManagement.expandAll'),
                handleExpandAll
              )}
              {renderIconButton(
                'mdi:unfold-less-horizontal',
                $t('page.menuManagement.collapseAll'),
                handleCollapseAll
              )}
            </div>
          </div>
        </div>

        <div class="menu-management__tree-scroll">
          <NSpin show={props.loading}>
            {props.treeData.length === 0 ? (
              <MenuEmptyState variant="tree" />
            ) : (
              <NTree
                blockLine
                selectable
                draggable
                expandOnClick
                data={treeOptions.value}
                expandedKeys={expandedKeys.value}
                selectedKeys={props.selectedKey ? [props.selectedKey] : []}
                onUpdateExpandedKeys={(keys: string[]) => {
                  expandedKeys.value = keys;
                }}
                onUpdateSelectedKeys={(keys: string[]) => emit('select', keys[0] ?? null)}
                onDrop={handleDrop}
              />
            )}
          </NSpin>
        </div>
      </div>
    );
  }
});
