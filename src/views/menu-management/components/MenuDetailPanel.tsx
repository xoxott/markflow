import type { PropType } from 'vue';
import { computed, defineComponent } from 'vue';
import { NBreadcrumb, NBreadcrumbItem, NButton, NCard, NSpace, NTag } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon';
import { $t } from '@/locales';
import { MENU_TYPE_META } from '../constants';
import type { MenuTreeNode } from '../types';
import { findMenuPath } from '../utils/menu-tree';
import MenuEmptyState from './MenuEmptyState';

export default defineComponent({
  name: 'MenuDetailPanel',
  props: {
    node: { type: Object as PropType<MenuTreeNode | null>, default: null },
    treeData: { type: Array as PropType<MenuTreeNode[]>, default: () => [] }
  },
  emits: ['edit', 'delete', 'toggle-status', 'add-child'],
  setup(props, { emit }) {
    const breadcrumb = computed(() =>
      props.node ? findMenuPath(props.treeData, props.node.id) : []
    );

    const typeMeta = computed(() => (props.node ? MENU_TYPE_META[props.node.type] : null));

    const detailItems = computed(() => {
      if (!props.node) return [];
      const node = props.node;
      return [
        { label: $t('page.menuManagement.fieldId'), value: node.id },
        { label: $t('page.menuManagement.routeKey'), value: node.routeKey ?? '-' },
        { label: $t('page.menuManagement.i18nKey'), value: node.i18nKey ?? '-' },
        { label: $t('page.menuManagement.icon'), value: node.icon ?? '-' },
        { label: $t('page.menuManagement.order'), value: String(node.order) },
        {
          label: $t('page.menuManagement.hideInMenu'),
          value: node.hideInMenu ? $t('page.menuManagement.yes') : $t('page.menuManagement.no')
        },
        {
          label: $t('page.menuManagement.activeMenu'),
          value: node.activeMenu ?? '-'
        },
        {
          label: $t('page.menuManagement.roleCodes'),
          value: node.roleCodes.length
            ? node.roleCodes.join(', ')
            : $t('page.menuManagement.allRoles')
        },
        { label: $t('page.menuManagement.updatedAt'), value: node.updatedAt }
      ];
    });

    return () => (
      <NCard bordered={false} class="menu-management__panel h-full card-wrapper">
        {{
          header: () => (
            <span class="menu-management__panel-title">
              {$t('page.menuManagement.detailTitle')}
            </span>
          ),
          default: () =>
            props.node ? (
              <div class="menu-management__panel-body">
                {breadcrumb.value.length > 1 ? (
                  <NBreadcrumb>
                    {breadcrumb.value.map(item => (
                      <NBreadcrumbItem key={item.id}>{item.name}</NBreadcrumbItem>
                    ))}
                  </NBreadcrumb>
                ) : null}

                <div class="menu-management__detail-header">
                  <div class="menu-management__detail-identity">
                    <div class="menu-management__detail-icon">
                      {props.node.icon ? (
                        <SvgIcon icon={props.node.icon} />
                      ) : (
                        <SvgIcon icon={typeMeta.value?.icon ?? 'mdi:menu'} />
                      )}
                    </div>
                    <div class="min-w-0">
                      <h3 class="menu-management__detail-name">{props.node.name}</h3>
                      <div class="menu-management__detail-meta">
                        <NTag
                          size="small"
                          type={typeMeta.value?.tagType ?? 'default'}
                          bordered={false}
                        >
                          {typeMeta.value?.label()}
                        </NTag>
                        <NTag
                          size="small"
                          type={props.node.isActive ? 'success' : 'warning'}
                          bordered={false}
                        >
                          {props.node.isActive
                            ? $t('page.menuManagement.active')
                            : $t('page.menuManagement.inactive')}
                        </NTag>
                        {props.node.constant ? (
                          <NTag size="small" type="default" bordered={false}>
                            {$t('page.menuManagement.constant')}
                          </NTag>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <NSpace wrap>
                    <NButton
                      size="small"
                      type="primary"
                      onClick={() => emit('edit', props.node!.id)}
                    >
                      {$t('common.edit')}
                    </NButton>
                    {props.node.type === 'group' ? (
                      <NButton size="small" onClick={() => emit('add-child', props.node!.id)}>
                        {$t('page.menuManagement.addChild')}
                      </NButton>
                    ) : null}
                    <NButton size="small" onClick={() => emit('toggle-status', props.node!.id)}>
                      {props.node.isActive
                        ? $t('page.menuManagement.disable')
                        : $t('page.menuManagement.enable')}
                    </NButton>
                    <NButton
                      size="small"
                      type="error"
                      ghost
                      onClick={() => emit('delete', props.node!.id)}
                    >
                      {$t('common.delete')}
                    </NButton>
                  </NSpace>
                </div>

                <div class="menu-management__detail-grid">
                  {detailItems.value.map(item => (
                    <div key={item.label} class="menu-management__detail-item">
                      <div class="menu-management__detail-label">{item.label}</div>
                      <div class="menu-management__detail-value">
                        {item.label === $t('page.menuManagement.icon') && props.node?.icon ? (
                          <NSpace align="center" size={8}>
                            <SvgIcon icon={props.node.icon} class="text-18px" />
                            <span>{item.value}</span>
                          </NSpace>
                        ) : (
                          item.value
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <MenuEmptyState variant="detail" />
            )
        }}
      </NCard>
    );
  }
});
