import { $t } from '@/locales';

export function createNotificationTypeOptions(): {
  label: string;
  value: Api.NotificationManagement.NotificationType;
}[] {
  return [
    { label: $t('page.notificationManagement.typeSystem'), value: 'system' },
    { label: $t('page.notificationManagement.typeUser'), value: 'user' },
    { label: $t('page.notificationManagement.typeWorkflow'), value: 'workflow' },
    { label: $t('page.notificationManagement.typeAlert'), value: 'alert' },
    { label: $t('page.notificationManagement.typeAnnouncement'), value: 'announcement' }
  ];
}

export function createNotificationPriorityOptions(): {
  label: string;
  value: Api.NotificationManagement.NotificationPriority;
}[] {
  return [
    { label: $t('page.notificationManagement.priorityLow'), value: 0 },
    { label: $t('page.notificationManagement.priorityNormal'), value: 1 },
    { label: $t('page.notificationManagement.priorityHigh'), value: 2 },
    { label: $t('page.notificationManagement.priorityUrgent'), value: 3 }
  ];
}

export function createNotificationStatusOptions(): {
  label: string;
  value: Api.NotificationManagement.NotificationStatus;
}[] {
  return [
    { label: $t('page.notificationManagement.statusDraft'), value: 'draft' },
    { label: $t('page.notificationManagement.statusPublished'), value: 'published' },
    { label: $t('page.notificationManagement.statusArchived'), value: 'archived' }
  ];
}
