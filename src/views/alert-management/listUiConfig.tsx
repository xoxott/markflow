import { NTag } from 'naive-ui';
import { formatApiDateTime } from '@/utils/datetime';
import { createActionColumn } from '@/components/table-page/utils/createActionColumn';
import type { SearchFieldConfig, TableColumnConfig } from '@/components/table-page/types';
import { $t } from '@/locales';
import {
  createAlertLevelOptions,
  createAlertStatusOptions,
  createAlertTypeOptions
} from './constants';

type Alert = Api.AlertManagement.Alert;

export function createAlertSearchFields(): SearchFieldConfig[] {
  return [
    {
      type: 'input',
      field: 'search',
      label: $t('common.searchFieldLabel'),
      placeholder: $t('page.alertManagement.searchPlaceholder'),
      icon: 'i-carbon-search',
      width: '200px'
    },
    {
      type: 'select',
      field: 'type',
      label: $t('page.alertManagement.type'),
      placeholder: $t('page.alertManagement.typePlaceholder'),
      width: '140px',
      options: createAlertTypeOptions()
    },
    {
      type: 'select',
      field: 'level',
      label: $t('page.alertManagement.level'),
      placeholder: $t('page.alertManagement.levelPlaceholder'),
      width: '120px',
      options: createAlertLevelOptions()
    },
    {
      type: 'select',
      field: 'status',
      label: $t('page.alertManagement.status'),
      placeholder: $t('page.alertManagement.statusPlaceholder'),
      width: '120px',
      options: createAlertStatusOptions()
    }
  ];
}

export interface AlertTableColumnHandlers {
  onEdit: (row: Alert) => void;
  onDelete: (row: Alert) => void;
  onAcknowledge: (row: Alert) => void;
  onResolve: (row: Alert) => void;
  canWrite: boolean;
  canDelete: boolean;
}

function renderLevelTag(level: Api.AlertManagement.AlertLevel | undefined) {
  if (!level) return '-';
  const levelMap: Record<
    Api.AlertManagement.AlertLevel,
    { label: string; type: 'error' | 'warning' | 'info' | 'default' }
  > = {
    critical: { label: $t('page.alertManagement.levelCritical'), type: 'error' },
    error: { label: $t('page.alertManagement.levelError'), type: 'error' },
    warning: { label: $t('page.alertManagement.levelWarning'), type: 'warning' },
    info: { label: $t('page.alertManagement.levelInfo'), type: 'info' }
  };
  const item = levelMap[level] ?? { label: level, type: 'default' as const };
  return <NTag type={item.type}>{item.label}</NTag>;
}

function renderStatusTag(status: Api.AlertManagement.AlertStatus | undefined) {
  if (!status) return '-';
  const statusMap: Record<
    Api.AlertManagement.AlertStatus,
    { label: string; type: 'default' | 'success' | 'info' }
  > = {
    pending: { label: $t('page.alertManagement.statusPending'), type: 'default' },
    acknowledged: {
      label: $t('page.alertManagement.statusAcknowledged'),
      type: 'info'
    },
    resolved: { label: $t('page.alertManagement.statusResolved'), type: 'success' }
  };
  const item = statusMap[status];
  if (!item) return status;
  return <NTag type={item.type}>{item.label}</NTag>;
}

function renderTypeTag(type: Api.AlertManagement.AlertType | undefined) {
  if (!type) return '-';
  const typeMap = Object.fromEntries(
    createAlertTypeOptions().map(option => [option.value, option.label])
  );
  return <NTag type="info">{typeMap[type] ?? type}</NTag>;
}

export function createAlertTableColumns(h: AlertTableColumnHandlers): TableColumnConfig<Alert>[] {
  return [
    {
      title: $t('page.alertManagement.name'),
      key: 'title',
      width: 200
    },
    {
      title: $t('page.alertManagement.message'),
      key: 'message',
      width: 280,
      render: (row: Alert) => {
        const message = row.message || '-';
        return message.length > 60 ? `${message.substring(0, 60)}...` : message;
      }
    },
    {
      title: $t('page.alertManagement.type'),
      key: 'type',
      width: 120,
      render: (row: Alert) => renderTypeTag(row.type)
    },
    {
      title: $t('page.alertManagement.level'),
      key: 'level',
      width: 110,
      render: (row: Alert) => renderLevelTag(row.level)
    },
    {
      title: $t('page.alertManagement.status'),
      key: 'status',
      width: 110,
      render: (row: Alert) => renderStatusTag(row.status)
    },
    {
      title: $t('page.alertManagement.source'),
      key: 'source',
      width: 120,
      render: (row: Alert) => row.source || '-'
    },
    {
      title: $t('page.alertManagement.acknowledgedAt'),
      key: 'acknowledgedAt',
      width: 170,
      render: (row: Alert) => formatApiDateTime(row.acknowledgedAt)
    },
    {
      title: $t('page.alertManagement.resolvedAt'),
      key: 'resolvedAt',
      width: 170,
      render: (row: Alert) => formatApiDateTime(row.resolvedAt)
    },
    {
      title: $t('page.alertManagement.createdAt'),
      key: 'createdAt',
      width: 170,
      render: (row: Alert) => formatApiDateTime(row.createdAt)
    },
    createActionColumn({
      mode: 'inline',
      maxShow: 2,
      buttons: [
        {
          label: $t('common.edit'),
          type: 'primary',
          icon: 'carbon:edit',
          show: () => h.canWrite,
          disabled: (row: Alert) => row.status === 'resolved',
          onClick: h.onEdit
        },
        {
          key: 'acknowledge',
          label: $t('page.alertManagement.acknowledge'),
          type: 'info',
          icon: 'carbon:checkmark',
          show: (row: Alert) => h.canWrite && row.status === 'pending',
          onClick: h.onAcknowledge
        },
        {
          key: 'resolve',
          label: $t('page.alertManagement.resolve'),
          type: 'success',
          icon: 'carbon:checkmark-filled',
          show: (row: Alert) => h.canWrite && row.status === 'pending',
          onClick: h.onResolve
        },
        {
          label: $t('common.delete'),
          type: 'error',
          icon: 'carbon:trash-can',
          show: () => h.canDelete,
          onClick: h.onDelete
        }
      ]
    })
  ];
}

export const ALERT_LIST_SCROLL_X = 1680;
