import { NTag } from 'naive-ui';
import { createActionColumn } from '@/components/table-page/utils/createActionColumn';
import type { SearchFieldConfig, TableColumnConfig } from '@/components/table-page/types';
import { AdminRemoteSelect } from '@/components/admin-remote-select';
import { $t } from '@/locales';

type Log = Api.LogManagement.Log;
export type LogListFilterLogType = Api.LogManagement.LogType | 'all';

const METHOD_TAG_TYPE: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  GET: 'info',
  POST: 'success',
  PUT: 'warning',
  DELETE: 'error',
  PATCH: 'warning'
};

export function getLogStatusTagType(
  status: number | null
): 'success' | 'warning' | 'error' | 'info' {
  if (status === null) return 'info';
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'info';
  if (status >= 400 && status < 500) return 'warning';
  return 'error';
}

/** 将 SearchBar 中的时间戳等字段转为接口入参 */
export function serializeLogListFilters(
  params: Record<string, unknown>
): Partial<Api.LogManagement.LogListParams> {
  const startDate = params.startDate;
  const endDate = params.endDate;
  const logType = params.logType as LogListFilterLogType | undefined;

  const result: Partial<Api.LogManagement.LogListParams> = {
    search: (params.search as string) || undefined,
    userId: params.userId as number | undefined,
    ip: (params.ip as string) || undefined,
    statusCode: params.statusCode as number | undefined,
    method: (params.method as string) || undefined,
    startDate: typeof startDate === 'number' ? new Date(startDate).toISOString() : undefined,
    endDate: typeof endDate === 'number' ? new Date(endDate).toISOString() : undefined,
    sortBy: params.sortBy as string | undefined,
    sortOrder: params.sortOrder as 'ASC' | 'DESC' | undefined
  };

  if (logType && logType !== 'all') {
    result.logType = logType;
  }

  return result;
}

export function createLogSearchFields(): SearchFieldConfig[] {
  return [
    {
      type: 'select',
      field: 'logType',
      label: $t('page.logManagement.logType'),
      placeholder: $t('page.logManagement.logTypePlaceholder'),
      width: '140px',
      clearable: true,
      options: [
        { label: $t('page.logManagement.logTypeAccess'), value: 'access' },
        { label: $t('page.logManagement.logTypeAudit'), value: 'audit' },
        { label: $t('page.logManagement.all'), value: 'all' }
      ]
    },
    {
      type: 'input',
      field: 'search',
      label: $t('common.searchFieldLabel'),
      placeholder: $t('page.logManagement.searchPlaceholder'),
      icon: 'i-carbon-search',
      width: '220px'
    },
    {
      type: 'custom',
      field: 'userId',
      label: $t('page.logManagement.userId'),
      render: (model, updateModel) => (
        <AdminRemoteSelect
          resource="users"
          value={(model.userId as number | null) ?? null}
          placeholder={$t('page.logManagement.userPlaceholder')}
          clearable
          onUpdate:value={value => updateModel('userId', value)}
        />
      )
    },
    {
      type: 'input',
      field: 'ip',
      label: $t('page.logManagement.ip'),
      placeholder: $t('page.logManagement.ipPlaceholder'),
      width: '150px'
    },
    {
      type: 'select',
      field: 'method',
      label: $t('page.logManagement.requestMethod'),
      placeholder: $t('page.logManagement.methodPlaceholder'),
      width: '120px',
      clearable: true,
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
        { label: 'PATCH', value: 'PATCH' }
      ]
    },
    {
      type: 'input-number',
      field: 'statusCode',
      label: $t('page.logManagement.responseStatus'),
      placeholder: $t('page.logManagement.statusCodePlaceholder'),
      width: '120px',
      clearable: true,
      componentProps: { min: 100, max: 599 }
    },
    {
      type: 'datetime',
      field: 'startDate',
      label: $t('page.logManagement.startDatePlaceholder'),
      placeholder: $t('page.logManagement.startDatePlaceholder'),
      width: '200px',
      clearable: true
    },
    {
      type: 'datetime',
      field: 'endDate',
      label: $t('page.logManagement.endDatePlaceholder'),
      placeholder: $t('page.logManagement.endDatePlaceholder'),
      width: '200px',
      clearable: true
    }
  ];
}

export interface LogTableColumnHandlers {
  onView: (row: Log) => void;
  onDelete: (row: Log) => void;
}

export function createLogTableColumns(h: LogTableColumnHandlers): TableColumnConfig<Log>[] {
  return [
    {
      title: $t('page.logManagement.username'),
      key: 'username',
      width: 120,
      render: (row: Log) => row.username ?? (row.userId !== null ? String(row.userId) : '-')
    },
    {
      title: $t('page.logManagement.ip'),
      key: 'ip',
      width: 150,
      render: (row: Log) => row.ip ?? '-'
    },
    {
      title: $t('page.logManagement.requestMethod'),
      key: 'method',
      width: 100,
      render: (row: Log) => {
        if (!row.method) return '-';
        return (
          <NTag type={METHOD_TAG_TYPE[row.method] || 'info'} size="small">
            {row.method}
          </NTag>
        );
      }
    },
    {
      title: $t('page.logManagement.requestUrl'),
      key: 'path',
      width: 300,
      ellipsis: { tooltip: true },
      render: (row: Log) => row.path ?? '-'
    },
    {
      title: $t('page.logManagement.responseStatus'),
      key: 'statusCode',
      width: 120,
      render: (row: Log) => (
        <NTag type={getLogStatusTagType(row.statusCode)} size="small">
          {row.statusCode}
        </NTag>
      )
    },
    {
      title: $t('page.logManagement.duration'),
      key: 'responseTime',
      width: 100,
      render: (row: Log) => `${row.responseTime}ms`
    },
    {
      title: $t('page.logManagement.createdAt'),
      key: 'createdAt',
      width: 180,
      render: 'date',
      renderConfig: { format: 'datetime' }
    },
    createActionColumn({
      mode: 'inline',
      buttons: [
        {
          label: $t('common.view'),
          type: 'primary',
          icon: 'carbon:view',
          onClick: h.onView
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

export const LOG_LIST_SCROLL_X = 1380;
