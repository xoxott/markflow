import { createQueryBooleanSelectOptions } from '@/constants/queryBoolean';
import { $t } from '@/locales';

export function createAnnouncementTypeOptions(): {
  label: string;
  value: Api.AnnouncementManagement.AnnouncementType;
}[] {
  return [
    { label: $t('page.announcementManagement.typeSystem'), value: 'system' },
    { label: $t('page.announcementManagement.typeMaintenance'), value: 'maintenance' },
    { label: $t('page.announcementManagement.typeFeature'), value: 'feature' },
    { label: $t('page.announcementManagement.typeWarning'), value: 'warning' },
    { label: $t('page.announcementManagement.typeInfo'), value: 'info' }
  ];
}

export function createAnnouncementStatusOptions(): {
  label: string;
  value: Api.AnnouncementManagement.AnnouncementStatus;
}[] {
  return [
    { label: $t('page.announcementManagement.statusDraft'), value: 'draft' },
    { label: $t('page.announcementManagement.statusPublished'), value: 'published' },
    { label: $t('page.announcementManagement.statusArchived'), value: 'archived' }
  ];
}

export function createAnnouncementStickyOptions() {
  return createQueryBooleanSelectOptions($t('common.yesOrNo.yes'), $t('common.yesOrNo.no'));
}
