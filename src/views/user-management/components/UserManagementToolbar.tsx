import type { PropType } from 'vue';
import { computed, defineComponent } from 'vue';
import type { DropdownOption } from 'naive-ui';
import { NBadge, NButton, NDropdown, NSpace, NTooltip } from 'naive-ui';
import TableColumnSetting from '@/components/advanced/table-column-setting';
import SvgIcon from '@/components/custom/svg-icon';
import { $t } from '@/locales';
import UserStatsInline from './UserStatsInline';

export default defineComponent({
  name: 'UserManagementToolbar',
  props: {
    stats: {
      type: Object as PropType<Api.UserManagement.UserStats | null>,
      default: null
    },
    statsLoading: {
      type: Boolean,
      default: false
    },
    selectedCount: {
      type: Number,
      default: 0
    },
    exportLoading: {
      type: Boolean,
      default: false
    },
    columnChecks: {
      type: Array as PropType<NaiveUI.TableColumnCheck[]>,
      default: () => []
    }
  },
  emits: [
    'add',
    'refresh',
    'export',
    'batchEnable',
    'batchDisable',
    'batchBlacklist',
    'batchDelete',
    'showOnlineUsers',
    'update:columnChecks'
  ],
  setup(props, { emit }) {
    const hasSelection = computed(() => props.selectedCount > 0);

    const batchOptions = computed<DropdownOption[]>(() => [
      {
        label: $t('page.userManagement.batchEnable'),
        key: 'enable',
        disabled: !hasSelection.value
      },
      {
        label: $t('page.userManagement.batchDisable'),
        key: 'disable',
        disabled: !hasSelection.value
      },
      {
        label: $t('page.userManagement.batchBlacklist'),
        key: 'blacklist',
        disabled: !hasSelection.value
      },
      { type: 'divider', key: 'divider' },
      {
        label: $t('common.batchDelete'),
        key: 'delete',
        disabled: !hasSelection.value
      }
    ]);

    const exportOptions = computed<DropdownOption[]>(() => [
      { label: $t('page.userManagement.exportCsv'), key: 'csv' },
      { label: $t('page.userManagement.exportExcel'), key: 'xlsx' }
    ]);

    function handleBatchSelect(key: string) {
      switch (key) {
        case 'enable':
          emit('batchEnable');
          break;
        case 'disable':
          emit('batchDisable');
          break;
        case 'blacklist':
          emit('batchBlacklist');
          break;
        case 'delete':
          emit('batchDelete');
          break;
        default:
          break;
      }
    }

    function handleExportSelect(key: string) {
      if (key === 'csv' || key === 'xlsx') {
        emit('export', key);
      }
    }

    return () => (
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <UserStatsInline
          stats={props.stats}
          loading={props.statsLoading}
          onClickOnline={() => emit('showOnlineUsers')}
        />

        <NSpace size="small" wrap={false} align="center">
          <NButton type="primary" onClick={() => emit('add')}>
            <div class="flex items-center gap-4px">
              <SvgIcon icon="carbon:add" class="text-16px" />
              <span>{$t('common.add')}</span>
            </div>
          </NButton>

          <NDropdown trigger="click" options={batchOptions.value} onSelect={handleBatchSelect}>
            <NButton secondary disabled={!hasSelection.value}>
              <div class="flex items-center gap-4px">
                <SvgIcon icon="carbon:list-checked" class="text-16px" />
                <span>{$t('page.userManagement.batchOperations')}</span>
                {hasSelection.value ? (
                  <NBadge value={props.selectedCount} type="info" processing={false} />
                ) : null}
              </div>
            </NButton>
          </NDropdown>

          <NDropdown trigger="click" options={exportOptions.value} onSelect={handleExportSelect}>
            <NButton loading={props.exportLoading}>
              <div class="flex items-center gap-4px">
                <SvgIcon icon="carbon:download" class="text-16px" />
                <span>{$t('common.export')}</span>
              </div>
            </NButton>
          </NDropdown>

          <NTooltip>
            {{
              trigger: () => (
                <NButton onClick={() => emit('refresh')} aria-label={$t('common.refresh')}>
                  <SvgIcon icon="carbon:renew" class="text-16px" />
                </NButton>
              ),
              default: () => $t('common.refresh')
            }}
          </NTooltip>

          {props.columnChecks.length > 0 ? (
            <TableColumnSetting
              columns={props.columnChecks}
              onUpdate:columns={(next: NaiveUI.TableColumnCheck[]) =>
                emit('update:columnChecks', next)
              }
            />
          ) : null}
        </NSpace>
      </div>
    );
  }
});
