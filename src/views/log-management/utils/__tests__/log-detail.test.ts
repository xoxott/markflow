import { describe, expect, it } from 'vitest';
import { formatMetadataValue, getLogTypeLabel, parseLogMetadata } from '../log-detail';

describe('formatMetadataValue', () => {
  it('returns null for empty values', () => {
    expect(formatMetadataValue(null)).toBeNull();
    expect(formatMetadataValue(undefined)).toBeNull();
  });

  it('pretty-prints JSON strings', () => {
    expect(formatMetadataValue('{"a":1}')).toBe('{\n  "a": 1\n}');
  });

  it('returns raw string when JSON parsing fails', () => {
    expect(formatMetadataValue('not-json')).toBe('not-json');
  });

  it('pretty-prints objects', () => {
    expect(formatMetadataValue({ foo: 'bar' })).toBe('{\n  "foo": "bar"\n}');
  });
});

describe('parseLogMetadata', () => {
  it('returns empty sections for missing metadata', () => {
    expect(parseLogMetadata(null)).toEqual({
      action: null,
      userAgent: null,
      query: null,
      body: null,
      extra: null
    });
  });

  it('splits known metadata fields from extra data', () => {
    expect(
      parseLogMetadata({
        action: 'USER_LOGGED_IN',
        userAgent: 'Mozilla/5.0',
        query: { page: 1 },
        body: { name: 'test' },
        email: 'user@example.com'
      })
    ).toEqual({
      action: 'USER_LOGGED_IN',
      userAgent: 'Mozilla/5.0',
      query: { page: 1 },
      body: { name: 'test' },
      extra: { email: 'user@example.com' }
    });
  });

  it('ignores non-string userAgent values', () => {
    expect(parseLogMetadata({ userAgent: 123 }).userAgent).toBeNull();
  });
});

describe('getLogTypeLabel', () => {
  it('maps log types to i18n keys', () => {
    expect(getLogTypeLabel('access')).toBe('page.logManagement.logTypeAccess');
    expect(getLogTypeLabel('audit')).toBe('page.logManagement.logTypeAudit');
  });
});
