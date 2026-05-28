import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import { NEmpty } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon';
import { $t } from '@/locales';

export default defineComponent({
  name: 'MenuEmptyState',
  props: {
    variant: {
      type: String as PropType<'tree' | 'detail'>,
      default: 'detail'
    }
  },
  setup(props) {
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
      </div>
    );
  }
});
