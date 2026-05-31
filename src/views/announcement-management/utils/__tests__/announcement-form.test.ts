import { describe, expect, it } from 'vitest';
import { buildWritePayload, createEmptyForm, parseTargetAudience } from '../announcement-form';

describe('parseTargetAudience', () => {
  it('returns undefined for empty input', () => {
    expect(parseTargetAudience('')).toBeUndefined();
    expect(parseTargetAudience('   ')).toBeUndefined();
  });

  it('splits comma-separated audiences and trims items', () => {
    expect(parseTargetAudience(' admin, user ,guest ')).toEqual(['admin', 'user', 'guest']);
  });
});

describe('buildWritePayload', () => {
  it('maps form fields to create request', () => {
    const form = {
      ...createEmptyForm(),
      title: 'Title',
      content: 'Body',
      type: 'system' as const,
      priority: 3,
      sticky: true,
      expiresAt: '2026-12-31T00:00:00.000Z',
      targetAudience: 'admin, user'
    };

    expect(buildWritePayload(form)).toEqual({
      title: 'Title',
      content: 'Body',
      type: 'system',
      priority: 3,
      sticky: true,
      expiresAt: '2026-12-31T00:00:00.000Z',
      targetAudience: ['admin', 'user']
    });
  });

  it('omits optional empty fields', () => {
    const form = {
      ...createEmptyForm(),
      title: 'Title',
      content: 'Body',
      type: 'info' as const,
      priority: null,
      expiresAt: '',
      targetAudience: ''
    };

    expect(buildWritePayload(form)).toEqual({
      title: 'Title',
      content: 'Body',
      type: 'info',
      sticky: false,
      expiresAt: undefined,
      targetAudience: undefined
    });
  });
});
