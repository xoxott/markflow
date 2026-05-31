import { $t } from '@/locales';

export function createAlertTypeOptions(): {
  label: string;
  value: Api.AlertManagement.AlertType;
}[] {
  return [
    { label: $t('page.alertManagement.typeSystem'), value: 'system' },
    { label: $t('page.alertManagement.typePerformance'), value: 'performance' },
    { label: $t('page.alertManagement.typeSecurity'), value: 'security' },
    { label: $t('page.alertManagement.typeDatabase'), value: 'database' },
    { label: $t('page.alertManagement.typeCustom'), value: 'custom' }
  ];
}

export function createAlertLevelOptions(): {
  label: string;
  value: Api.AlertManagement.AlertLevel;
}[] {
  return [
    { label: $t('page.alertManagement.levelInfo'), value: 'info' },
    { label: $t('page.alertManagement.levelWarning'), value: 'warning' },
    { label: $t('page.alertManagement.levelError'), value: 'error' },
    { label: $t('page.alertManagement.levelCritical'), value: 'critical' }
  ];
}

export function createAlertStatusOptions(): {
  label: string;
  value: Api.AlertManagement.AlertStatus;
}[] {
  return [
    { label: $t('page.alertManagement.statusPending'), value: 'pending' },
    { label: $t('page.alertManagement.statusAcknowledged'), value: 'acknowledged' },
    { label: $t('page.alertManagement.statusResolved'), value: 'resolved' }
  ];
}
