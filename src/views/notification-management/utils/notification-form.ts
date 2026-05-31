import type { NotificationFormData } from '../components/dialog';

const NOTIFICATION_PRIORITIES = [0, 1, 2, 3] as const;

function toNotificationPriority(
  priority: number | null
): Api.NotificationManagement.NotificationPriority | undefined {
  if (priority === null) return undefined;
  return NOTIFICATION_PRIORITIES.includes(priority as (typeof NOTIFICATION_PRIORITIES)[number])
    ? (priority as Api.NotificationManagement.NotificationPriority)
    : undefined;
}

export function createEmptyForm(): NotificationFormData {
  return {
    title: '',
    content: '',
    type: 'system',
    priority: 1,
    expiresAt: '',
    targetUserIds: [],
    targetRoleIds: []
  };
}

export function buildWritePayload(
  form: NotificationFormData
): Api.NotificationManagement.CreateNotificationRequest {
  return {
    title: form.title,
    content: form.content,
    type: form.type,
    priority: toNotificationPriority(form.priority),
    expiresAt: form.expiresAt || undefined,
    targetUserIds: form.targetUserIds.length > 0 ? form.targetUserIds : undefined,
    targetRoleIds: form.targetRoleIds.length > 0 ? form.targetRoleIds : undefined
  };
}
