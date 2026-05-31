import { NTag } from 'naive-ui';
import { formatApiDateTime } from '@/utils/datetime';
import { createActionColumn } from '@/components/table-page/utils/createActionColumn';
import type { SearchFieldConfig, TableColumnConfig } from '@/components/table-page/types';
import { $t } from '@/locales';
import { createNotificationStatusOptions, createNotificationTypeOptions } from './constants';

type Notification = Api.NotificationManagement.Notification;

export function createNotificationSearchFields(): SearchFieldConfig[] {
  return [
    {
      type: 'input',
      field: 'search',
      label: $t('common.searchFieldLabel'),
      placeholder: $t('page.notificationManagement.searchPlaceholder'),
      icon: 'i-carbon-search',
      width: '200px'
    },
    {
      type: 'select',
      field: 'type',
      label: $t('page.notificationManagement.type'),
      placeholder: $t('page.notificationManagement.typePlaceholder'),
      width: '140px',
      options: createNotificationTypeOptions()
    },
    {
      type: 'select',
      field: 'status',
      label: $t('page.notificationManagement.status'),
      placeholder: $t('page.notificationManagement.statusPlaceholder'),
      width: '120px',
      options: createNotificationStatusOptions()
    }
  ];
}

export interface NotificationTableColumnHandlers {
  onEdit: (row: Notification) => void;
  onDelete: (row: Notification) => void;
  onPublish: (row: Notification) => void;
  onRepublish: (row: Notification) => void;
  onRevertToDraft: (row: Notification) => void;
  onArchive: (row: Notification) => void;
  canWrite: boolean;
  canDelete: boolean;
}

function renderTypeTag(type: Api.NotificationManagement.NotificationType | undefined) {
  if (!type) return '-';
  const typeMap = Object.fromEntries(
    createNotificationTypeOptions().map(option => [option.value, option.label])
  );
  return <NTag type="info">{typeMap[type] ?? type}</NTag>;
}

function renderStatusTag(status: Api.NotificationManagement.NotificationStatus | undefined) {
  if (!status) return '-';
  const statusMap: Record<
    Api.NotificationManagement.NotificationStatus,
    { label: string; type: 'default' | 'success' | 'warning' }
  > = {
    draft: { label: $t('page.notificationManagement.statusDraft'), type: 'default' },
    published: {
      label: $t('page.notificationManagement.statusPublished'),
      type: 'success'
    },
    archived: { label: $t('page.notificationManagement.statusArchived'), type: 'warning' }
  };
  const item = statusMap[status];
  if (!item) return status;
  return <NTag type={item.type}>{item.label}</NTag>;
}

export function createNotificationTableColumns(
  h: NotificationTableColumnHandlers
): TableColumnConfig<Notification>[] {
  return [
    {
      title: $t('page.notificationManagement.title'),
      key: 'title',
      width: 200
    },
    {
      title: $t('page.notificationManagement.content'),
      key: 'content',
      width: 300,
      render: (row: Notification) => {
        const content = row.content || '-';
        return content.length > 50 ? `${content.substring(0, 50)}...` : content;
      }
    },
    {
      title: $t('page.notificationManagement.type'),
      key: 'type',
      width: 120,
      render: (row: Notification) => renderTypeTag(row.type)
    },
    {
      title: $t('page.notificationManagement.priority'),
      key: 'priority',
      width: 100,
      render: (row: Notification) => row.priority ?? '-'
    },
    {
      title: $t('page.notificationManagement.targetUsers'),
      key: 'targetUserIds',
      width: 150,
      render: (row: Notification) => {
        if (!row.targetUserIds || row.targetUserIds.length === 0) {
          return row.targetRoleIds && row.targetRoleIds.length > 0
            ? $t('page.notificationManagement.targetRoles')
            : $t('page.notificationManagement.allUsers');
        }
        return `${row.targetUserIds.length} ${$t('page.notificationManagement.users')}`;
      }
    },
    {
      title: $t('page.notificationManagement.readStatus'),
      key: 'readStatus',
      width: 120,
      render: (row: Notification) => {
        if (row.readCount !== null && row.totalCount !== null && row.totalCount > 0) {
          return `${row.readCount}/${row.totalCount}`;
        }
        return '-';
      }
    },
    {
      title: $t('page.notificationManagement.status'),
      key: 'status',
      width: 110,
      render: (row: Notification) => renderStatusTag(row.status)
    },
    {
      title: $t('page.notificationManagement.publishedAt'),
      key: 'publishedAt',
      width: 180,
      render: (row: Notification) => formatApiDateTime(row.publishedAt)
    },
    {
      title: $t('page.notificationManagement.expiresAt'),
      key: 'expiresAt',
      width: 180,
      render: (row: Notification) => formatApiDateTime(row.expiresAt)
    },
    {
      title: $t('page.notificationManagement.createdAt'),
      key: 'createdAt',
      width: 180,
      render: (row: Notification) => formatApiDateTime(row.createdAt)
    },
    createActionColumn(
      {
        mode: 'menu',
        buttons: [
          {
            label: $t('common.edit'),
            type: 'primary',
            icon: 'carbon:edit',
            show: () => h.canWrite,
            disabled: (row: Notification) => row.status !== 'draft',
            onClick: h.onEdit
          },
          {
            key: 'publish',
            label: $t('page.notificationManagement.publish'),
            type: 'success',
            icon: 'carbon:send',
            show: (row: Notification) => h.canWrite && row.status === 'draft',
            onClick: h.onPublish
          },
          {
            key: 'republish',
            label: $t('page.notificationManagement.republish'),
            type: 'success',
            icon: 'carbon:reset',
            show: (row: Notification) => h.canWrite && row.status === 'archived',
            onClick: h.onRepublish
          },
          {
            key: 'revertToDraft',
            label: $t('page.notificationManagement.revertToDraft'),
            type: 'warning',
            icon: 'carbon:undo',
            show: (row: Notification) => h.canWrite && row.status === 'published',
            onClick: h.onRevertToDraft
          },
          {
            key: 'archive',
            label: $t('page.notificationManagement.archive'),
            type: 'warning',
            icon: 'carbon:archive',
            show: (row: Notification) => h.canWrite && row.status === 'published',
            onClick: h.onArchive
          },
          {
            label: $t('common.delete'),
            type: 'error',
            icon: 'carbon:trash-can',
            show: () => h.canDelete,
            onClick: h.onDelete
          }
        ]
      },
      { width: 120 }
    )
  ];
}

export const NOTIFICATION_LIST_SCROLL_X = 2160;
