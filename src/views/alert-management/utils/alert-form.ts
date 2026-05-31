import type { AlertFormData } from '../components/dialog';

export function createEmptyForm(): AlertFormData {
  return {
    type: 'system',
    level: 'warning',
    title: '',
    message: '',
    source: ''
  };
}

export function buildWritePayload(form: AlertFormData): Api.AlertManagement.CreateAlertRequest {
  return {
    type: form.type,
    level: form.level,
    title: form.title,
    message: form.message,
    source: form.source || undefined
  };
}
