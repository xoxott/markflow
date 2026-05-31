import { NTag } from 'naive-ui';
import { createActionColumn } from '@/components/table-page/utils/createActionColumn';
import type { SearchFieldConfig, TableColumnConfig } from '@/components/table-page/types';
import { $t } from '@/locales';
import { createAnnouncementStatusOptions, createAnnouncementTypeOptions } from './constants';

type Announcement = Api.AnnouncementManagement.Announcement;

export function createAnnouncementSearchFields(): SearchFieldConfig[] {
  return [
    {
      type: 'input',
      field: 'search',
      label: $t('common.searchFieldLabel'),
      placeholder: $t('page.announcementManagement.searchPlaceholder'),
      icon: 'i-carbon-search',
      width: '200px'
    },
    {
      type: 'select',
      field: 'type',
      label: $t('page.announcementManagement.type'),
      placeholder: $t('page.announcementManagement.typePlaceholder'),
      width: '140px',
      options: createAnnouncementTypeOptions()
    },
    {
      type: 'select',
      field: 'status',
      label: $t('page.announcementManagement.status'),
      placeholder: $t('page.announcementManagement.statusPlaceholder'),
      width: '120px',
      options: createAnnouncementStatusOptions()
    }
  ];
}

export interface AnnouncementTableColumnHandlers {
  onEdit: (row: Announcement) => void;
  onDelete: (row: Announcement) => void;
  onPublish: (row: Announcement) => void;
  onRepublish: (row: Announcement) => void;
  onRevertToDraft: (row: Announcement) => void;
  onArchive: (row: Announcement) => void;
}

function renderTypeTag(type: Api.AnnouncementManagement.AnnouncementType | undefined) {
  if (!type) return '-';
  const typeMap: Record<Api.AnnouncementManagement.AnnouncementType, string> = {
    system: $t('page.announcementManagement.typeSystem'),
    maintenance: $t('page.announcementManagement.typeMaintenance'),
    feature: $t('page.announcementManagement.typeFeature'),
    warning: $t('page.announcementManagement.typeWarning'),
    info: $t('page.announcementManagement.typeInfo')
  };
  return <NTag type="info">{typeMap[type] ?? type}</NTag>;
}

function renderStatusTag(status: Api.AnnouncementManagement.AnnouncementStatus | undefined) {
  if (!status) return '-';
  const statusMap: Record<
    Api.AnnouncementManagement.AnnouncementStatus,
    { label: string; type: 'default' | 'success' | 'warning' }
  > = {
    draft: { label: $t('page.announcementManagement.statusDraft'), type: 'default' },
    published: { label: $t('page.announcementManagement.statusPublished'), type: 'success' },
    archived: { label: $t('page.announcementManagement.statusArchived'), type: 'warning' }
  };
  const item = statusMap[status];
  if (!item) return status;
  return <NTag type={item.type}>{item.label}</NTag>;
}

export function createAnnouncementTableColumns(
  h: AnnouncementTableColumnHandlers
): TableColumnConfig<Announcement>[] {
  return [
    {
      title: $t('page.announcementManagement.title'),
      key: 'title',
      width: 200
    },
    {
      title: $t('page.announcementManagement.content'),
      key: 'content',
      width: 300,
      render: (row: Announcement) => {
        const content = row.content || '-';
        return content.length > 50 ? `${content.substring(0, 50)}...` : content;
      }
    },
    {
      title: $t('page.announcementManagement.type'),
      key: 'type',
      width: 120,
      render: (row: Announcement) => renderTypeTag(row.type)
    },
    {
      title: $t('page.announcementManagement.priority'),
      key: 'priority',
      width: 100,
      render: (row: Announcement) => row.priority ?? '-'
    },
    {
      title: $t('page.announcementManagement.sticky'),
      key: 'sticky',
      width: 90,
      render: (row: Announcement) =>
        row.sticky ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
    },
    {
      title: $t('page.announcementManagement.status'),
      key: 'status',
      width: 110,
      render: (row: Announcement) => renderStatusTag(row.status)
    },
    {
      title: $t('page.announcementManagement.publishedAt'),
      key: 'publishedAt',
      width: 180,
      render: (row: Announcement) =>
        row.publishedAt ? new Date(row.publishedAt).toLocaleString('zh-CN') : '-'
    },
    {
      title: $t('page.announcementManagement.expiresAt'),
      key: 'expiresAt',
      width: 180,
      render: (row: Announcement) =>
        row.expiresAt ? new Date(row.expiresAt).toLocaleString('zh-CN') : '-'
    },
    {
      title: $t('page.announcementManagement.createdAt'),
      key: 'createdAt',
      width: 180,
      render: (row: Announcement) =>
        row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN') : '-'
    },
    createActionColumn(
      {
        mode: 'menu',
        buttons: [
          {
            label: $t('common.edit'),
            type: 'primary',
            icon: 'carbon:edit',
            onClick: h.onEdit
          },
          {
            key: 'publish',
            label: $t('page.announcementManagement.publish'),
            type: 'success',
            icon: 'carbon:send',
            show: (row: Announcement) => row.status === 'draft',
            onClick: h.onPublish
          },
          {
            key: 'republish',
            label: $t('page.announcementManagement.republish'),
            type: 'success',
            icon: 'carbon:reset',
            show: (row: Announcement) => row.status === 'archived',
            onClick: h.onRepublish
          },
          {
            key: 'revertToDraft',
            label: $t('page.announcementManagement.revertToDraft'),
            type: 'warning',
            icon: 'carbon:undo',
            show: (row: Announcement) => row.status === 'published',
            onClick: h.onRevertToDraft
          },
          {
            key: 'archive',
            label: $t('page.announcementManagement.archive'),
            type: 'warning',
            icon: 'carbon:archive',
            show: (row: Announcement) => row.status === 'published',
            onClick: h.onArchive
          },
          {
            label: $t('common.delete'),
            type: 'error',
            icon: 'carbon:trash-can',
            onClick: h.onDelete
          }
        ]
      },
      { width: 120 }
    )
  ];
}

export const ANNOUNCEMENT_LIST_SCROLL_X = 1980;
