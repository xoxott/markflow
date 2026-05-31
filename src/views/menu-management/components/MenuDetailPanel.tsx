import type { PropType } from 'vue';
import { computed, defineComponent, nextTick, onActivated, ref, watch } from 'vue';
import { useElementSize } from '@vueuse/core';
import {
  NBreadcrumb,
  NBreadcrumbItem,
  NButton,
  NCard,
  NScrollbar,
  NSpace,
  NTag
} from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon';
import { $t } from '@/locales';
import { MENU_TYPE_META } from '../constants';
import type { MenuTreeNode } from '../types';
import { buildMenuDetailItems } from '../utils/menu-detail';
import { menuTypeRequiresRouteRegistry } from '../utils/menu-type';
import { findMenuPath, resolveMenuNodeLabel } from '../utils/menu-tree';
import MenuEmptyState from './MenuEmptyState';

export default defineComponent({
  name: 'MenuDetailPanel',
  props: {
    node: { type: Object as PropType<MenuTreeNode | null>, default: null },
    treeData: { type: Array as PropType<MenuTreeNode[]>, default: () => [] },
    registryItem: {
      type: Object as PropType<Api.MenuManagement.RouteRegistryItem | null>,
      default: null
    }
  },
  emits: ['edit', 'delete', 'toggle-status', 'add-child', 'select'],
  setup(props, { emit }) {
    const scrollHostRef = ref<HTMLElement | null>(null);
    const scrollbarRef = ref<{ sync?: () => void } | null>(null);
    const { height: scrollHostHeight } = useElementSize(scrollHostRef);
    const scrollStyle = computed(() => {
      const height = scrollHostHeight.value;
      return height > 0 ? { height: `${height}px` } : undefined;
    });

    const syncScrollbar = () => {
      nextTick(() => scrollbarRef.value?.sync?.());
    };

    watch([scrollHostHeight, () => props.node?.id], ([height]) => {
      if (height > 0) syncScrollbar();
    });

    onActivated(syncScrollbar);

    const breadcrumb = computed(() =>
      props.node ? findMenuPath(props.treeData, props.node.id) : []
    );

    const typeMeta = computed(() => (props.node ? MENU_TYPE_META[props.node.type] : null));

    const detailItems = computed(() =>
      props.node
        ? buildMenuDetailItems(props.node, props.registryItem ?? undefined, props.treeData)
        : []
    );

    const showConstantTag = computed(() =>
      Boolean(
        props.node && menuTypeRequiresRouteRegistry(props.node.type) && props.registryItem?.constant
      )
    );

    const renderDetailValue = (item: ReturnType<typeof buildMenuDetailItems>[number]) => {
      if (item.variant === 'icon' && props.node?.icon) {
        return (
          <NSpace align="center" size={8}>
            <SvgIcon icon={props.node.icon} class="text-18px" />
            <span>{item.value}</span>
          </NSpace>
        );
      }

      if (item.variant === 'permissionCodes' && props.node?.permissionCodes.length) {
        return (
          <NSpace size={4} wrap>
            {props.node.permissionCodes.map(code => (
              <NTag key={code} size="small" bordered={false}>
                {code}
              </NTag>
            ))}
          </NSpace>
        );
      }

      return item.value;
    };

    const renderDetailContent = () => {
      if (!props.node) {
        return <MenuEmptyState variant="detail" />;
      }

      return (
        <>
          {breadcrumb.value.length > 1 ? (
            <NBreadcrumb>
              {breadcrumb.value.map((item, index) => {
                const isLast = index === breadcrumb.value.length - 1;
                return (
                  <NBreadcrumbItem
                    key={item.id}
                    clickable={!isLast}
                    onClick={
                      isLast
                        ? undefined
                        : () => {
                            emit('select', item.id);
                          }
                    }
                  >
                    {resolveMenuNodeLabel(item)}
                  </NBreadcrumbItem>
                );
              })}
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
                <h3 class="menu-management__detail-name">{resolveMenuNodeLabel(props.node)}</h3>
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
                  {showConstantTag.value ? (
                    <NTag size="small" type="default" bordered={false}>
                      {$t('page.menuManagement.constant')}
                    </NTag>
                  ) : null}
                </div>
              </div>
            </div>

            <NSpace wrap>
              <NButton size="small" type="primary" onClick={() => emit('edit', props.node!.id)}>
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
              <div key={item.key} class="menu-management__detail-item">
                <div class="menu-management__detail-label">{item.label}</div>
                <div class="menu-management__detail-value">{renderDetailValue(item)}</div>
              </div>
            ))}
          </div>
        </>
      );
    };

    return () => (
      <NCard bordered={false} class="menu-management__panel menu-management__panel--detail h-full card-wrapper">
        {{
          header: () => (
            <span class="menu-management__panel-title">
              {$t('page.menuManagement.detailTitle')}
            </span>
          ),
          default: () => (
            <div class="menu-management__panel-body">
              <div ref={scrollHostRef} class="menu-management__detail-scroll-host">
                <NScrollbar
                  ref={scrollbarRef}
                  class="menu-management__detail-scroll"
                  style={scrollStyle.value}
                  yPlacement="right"
                >
                  <div class="menu-management__detail-scroll-content">{renderDetailContent()}</div>
                </NScrollbar>
              </div>
            </div>
          )
        }}
      </NCard>
    );
  }
});
