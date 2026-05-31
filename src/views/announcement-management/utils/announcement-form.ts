import type { AnnouncementFormData } from '../components/dialog';

export function createEmptyForm(): AnnouncementFormData {
  return {
    title: '',
    content: '',
    type: 'info',
    priority: 0,
    sticky: false,
    expiresAt: '',
    targetAudience: ''
  };
}

export function parseTargetAudience(raw: string): string[] | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return trimmed
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

export function buildWritePayload(
  form: AnnouncementFormData
): Api.AnnouncementManagement.CreateAnnouncementRequest {
  return {
    title: form.title,
    content: form.content,
    type: form.type as Api.AnnouncementManagement.AnnouncementType,
    priority: form.priority ?? undefined,
    sticky: form.sticky,
    expiresAt: form.expiresAt || undefined,
    targetAudience: parseTargetAudience(form.targetAudience)
  };
}
