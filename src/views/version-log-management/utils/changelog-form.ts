import type { VersionLogFormData } from '../components/dialog';

/** 与 ai-server Version.VERSION_REGEX 保持一致 */
export const CHANGELOG_VERSION_PATTERN = /^v?\d+\.\d+\.\d+(-[\w.]+)?$/;

const CHANGE_FIELDS: Array<{
  field: keyof Pick<
    VersionLogFormData,
    'features' | 'fixes' | 'improvements' | 'breaking' | 'security' | 'deprecated'
  >;
  type: Api.VersionLogManagement.ChangeType;
}> = [
  { field: 'features', type: 'feature' },
  { field: 'fixes', type: 'fix' },
  { field: 'improvements', type: 'improvement' },
  { field: 'breaking', type: 'breaking' },
  { field: 'security', type: 'security' },
  { field: 'deprecated', type: 'deprecated' }
];

function parseLines(raw: string): string[] {
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

/** 后端根据版本号后缀自动判定 isPrerelease（见 Version.isPrerelease） */
export function isPrereleaseVersion(version: string): boolean {
  const trimmed = version.trim();
  if (!CHANGELOG_VERSION_PATTERN.test(trimmed)) {
    return false;
  }

  return trimmed.includes('-');
}

function buildChanges(form: VersionLogFormData): Api.VersionLogManagement.ChangeItem[] {
  const changes: Api.VersionLogManagement.ChangeItem[] = [];

  for (const { field, type } of CHANGE_FIELDS) {
    parseLines(form[field]).forEach(description => {
      changes.push({ type, description });
    });
  }

  if (changes.length === 0 && form.title.trim()) {
    changes.push({ type: 'improvement', description: form.title.trim() });
  }

  return changes;
}

function joinChangesByType(
  changes: Api.VersionLogManagement.ChangeItem[],
  type: Api.VersionLogManagement.ChangeType
): string {
  return changes
    .filter(item => item.type === type)
    .map(item => item.description)
    .join('\n');
}

export function createEmptyForm(): VersionLogFormData {
  return {
    version: '',
    title: '',
    description: '',
    releaseDate: '',
    features: '',
    fixes: '',
    improvements: '',
    breaking: '',
    security: '',
    deprecated: ''
  };
}

/** 仅提交 CreateChangelogDto 字段；isPrerelease / breakingChanges / deprecations 由后端从 changes 推导 */
export function buildCreatePayload(
  form: VersionLogFormData
): Api.VersionLogManagement.CreateVersionLogRequest {
  return {
    version: form.version.trim(),
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    changes: buildChanges(form),
    releaseDate: form.releaseDate
  };
}

export function buildUpdatePayload(
  form: VersionLogFormData
): Api.VersionLogManagement.UpdateVersionLogRequest {
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    changes: buildChanges(form),
    releaseDate: form.releaseDate
  };
}

export function mapDetailToForm(detail: Api.VersionLogManagement.VersionLog): VersionLogFormData {
  return {
    version: detail.version,
    title: detail.title,
    description: detail.description || '',
    releaseDate: detail.releaseDate,
    features: joinChangesByType(detail.changes, 'feature'),
    fixes: joinChangesByType(detail.changes, 'fix'),
    improvements: joinChangesByType(detail.changes, 'improvement'),
    breaking: joinChangesByType(detail.changes, 'breaking'),
    security: joinChangesByType(detail.changes, 'security'),
    deprecated: joinChangesByType(detail.changes, 'deprecated')
  };
}
