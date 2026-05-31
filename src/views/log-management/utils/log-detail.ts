type LogMetadata = Record<string, unknown>;

export interface ParsedLogMetadata {
  action: string | null;
  userAgent: string | null;
  query: unknown;
  body: unknown;
  extra: LogMetadata | null;
}

export function formatMetadataValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  return JSON.stringify(value, null, 2);
}

export function parseLogMetadata(metadata: LogMetadata | null | undefined): ParsedLogMetadata {
  if (!metadata || Object.keys(metadata).length === 0) {
    return {
      action: null,
      userAgent: null,
      query: null,
      body: null,
      extra: null
    };
  }

  const { action, userAgent, query, body, ...rest } = metadata;

  return {
    action: action !== null && action !== undefined ? String(action) : null,
    userAgent: typeof userAgent === 'string' ? userAgent : null,
    query: query ?? null,
    body: body ?? null,
    extra: Object.keys(rest).length > 0 ? rest : null
  };
}

export function getLogTypeLabel(logType: Api.LogManagement.LogType): App.I18n.I18nKey {
  return logType === 'audit'
    ? 'page.logManagement.logTypeAudit'
    : 'page.logManagement.logTypeAccess';
}
