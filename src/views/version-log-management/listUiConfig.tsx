import { NSpace, NTag } from 'naive-ui';
import { formatApiDateTime } from '@/utils/datetime';
import { createActionColumn } from '@/components/table-page/utils/createActionColumn';
import type { SearchFieldConfig, TableColumnConfig } from '@/components/table-page/types';
import { $t } from '@/locales';

type VersionLog = Api.VersionLogManagement.VersionLog;

export function normalizeVersionLogRemoteSorter(sorter: unknown) {
  const cleared = {
    sortBy: undefined as string | undefined,
    sortOrder: undefined as 'ASC' | 'DESC' | undefined
  };
  if (!sorter) return cleared;
  const list = Array.isArray(sorter) ? sorter : [sorter];
  const first = list[0] as { columnKey?: string | number; order?: unknown } | undefined;
  if (!first?.columnKey) return cleared;
  const order = first.order;
  if (order !== 'ascend' && order !== 'descend') return cleared;
  return {
    sortBy: String(first.columnKey) === 'version' ? 'versionString' : String(first.columnKey),
    sortOrder: (order === 'ascend' ? 'ASC' : 'DESC') as 'ASC' | 'DESC'
  };
}

export function createVersionLogSearchFields(): SearchFieldConfig[] {
  return [
    {
      type: 'input',
      field: 'search',
      label: $t('common.searchFieldLabel'),
      placeholder: $t('page.versionLogManagement.searchPlaceholder'),
      icon: 'i-carbon-search',
      width: '200px'
    }
  ];
}

export interface VersionLogTableColumnHandlers {
  onEdit: (row: VersionLog) => void;
  onDelete: (row: VersionLog) => void;
}

export function createVersionLogTableColumns(
  h: VersionLogTableColumnHandlers
): TableColumnConfig<VersionLog>[] {
  return [
    {
      title: $t('page.versionLogManagement.version'),
      key: 'version',
      width: 120,
      sorter: true
    },
    {
      title: $t('page.versionLogManagement.releaseTitle'),
      key: 'title',
      width: 220,
      sorter: true,
      render: (row: VersionLog) => {
        const title = row.title || '-';
        return title.length > 40 ? `${title.substring(0, 40)}...` : title;
      }
    },
    {
      title: $t('page.versionLogManagement.releaseDate'),
      key: 'releaseDate',
      width: 120,
      sorter: true,
      render: (row: VersionLog) => formatApiDateTime(row.releaseDate, { format: 'date' })
    },
    {
      title: $t('page.versionLogManagement.changeCount'),
      key: 'changes',
      width: 100,
      render: (row: VersionLog) => row.changes?.length ?? 0
    },
    {
      title: $t('page.versionLogManagement.isPrerelease'),
      key: 'isPrerelease',
      width: 120,
      render: (row: VersionLog) => (
        <NTag type={row.isPrerelease ? 'warning' : 'success'}>
          {row.isPrerelease
            ? $t('page.versionLogManagement.prerelease')
            : $t('page.versionLogManagement.stableRelease')}
        </NTag>
      )
    },
    {
      title: $t('page.versionLogManagement.changeFlags'),
      key: 'changeFlags',
      width: 160,
      render: (row: VersionLog) => {
        if (!row.hasBreakingChanges && !row.hasDeprecations) {
          return '-';
        }

        return (
          <NSpace size="small">
            {row.hasBreakingChanges ? (
              <NTag type="error" size="small">
                {$t('page.versionLogManagement.hasBreakingChanges')}
              </NTag>
            ) : null}
            {row.hasDeprecations ? (
              <NTag type="warning" size="small">
                {$t('page.versionLogManagement.hasDeprecations')}
              </NTag>
            ) : null}
          </NSpace>
        );
      }
    },
    {
      title: $t('page.versionLogManagement.createdAt'),
      key: 'createdAt',
      width: 180,
      sorter: true,
      render: (row: VersionLog) => formatApiDateTime(row.createdAt)
    },
    createActionColumn({
      mode: 'inline',
      buttons: [
        {
          label: $t('common.edit'),
          type: 'primary',
          icon: 'carbon:edit',
          onClick: h.onEdit
        },
        {
          label: $t('common.delete'),
          type: 'error',
          icon: 'carbon:trash-can',
          onClick: h.onDelete
        }
      ]
    })
  ];
}

export const VERSION_LOG_LIST_SCROLL_X = 1440;
