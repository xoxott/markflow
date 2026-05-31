import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import { NButton, NEmpty, NSpace } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon';
import { $t } from '@/locales';

export default defineComponent({
  name: 'MenuEmptyState',
  props: {
    variant: {
      type: String as PropType<'tree' | 'detail'>,
      default: 'detail'
    },
    syncing: { type: Boolean, default: false }
  },
  emits: ['sync'],
  setup(props, { emit }) {
    return () => (
      <div class="menu-management__detail-empty">
        <SvgIcon
          icon={
            props.variant === 'tree' ? 'mdi:file-tree-outline' : 'mdi:cursor-default-click-outline'
          }
          class="text-48px opacity-40"
        />
        <NEmpty
          description={
            props.variant === 'tree'
              ? $t('page.menuManagement.emptyTree')
              : $t('page.menuManagement.selectNodeHint')
          }
          size="small"
        />
        {props.variant === 'tree' ? (
          <NSpace vertical align="center" size={8} class="menu-management__empty-actions">
            <NButton type="primary" loading={props.syncing} onClick={() => emit('sync')}>
              {{
                icon: () => <SvgIcon icon="mdi:database-sync-outline" class="text-16px" />,
                default: () => $t('page.menuManagement.syncRoutes')
              }}
            </NButton>
            <span class="menu-management__empty-hint">
              {$t('page.menuManagement.syncRoutesHint')}
            </span>
          </NSpace>
        ) : null}
      </div>
    );
  }
});
