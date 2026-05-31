import { describe, expect, it } from 'vitest';
import { buildWritePayload, createEmptyForm } from '../notification-form';

describe('buildWritePayload', () => {
  it('maps form fields to create request', () => {
    const form = {
      ...createEmptyForm(),
      title: 'Title',
      content: 'Body',
      type: 'alert' as const,
      priority: 2,
      expiresAt: '2026-12-31T00:00:00.000Z',
      targetUserIds: [1, 2],
      targetRoleIds: [3]
    };

    expect(buildWritePayload(form)).toEqual({
      title: 'Title',
      content: 'Body',
      type: 'alert',
      priority: 2,
      expiresAt: '2026-12-31T00:00:00.000Z',
      targetUserIds: [1, 2],
      targetRoleIds: [3]
    });
  });

  it('omits optional empty fields', () => {
    const form = {
      ...createEmptyForm(),
      title: 'Title',
      content: 'Body',
      type: 'system' as const,
      priority: null,
      expiresAt: '',
      targetUserIds: [],
      targetRoleIds: []
    };

    expect(buildWritePayload(form)).toEqual({
      title: 'Title',
      content: 'Body',
      type: 'system',
      expiresAt: undefined,
      targetUserIds: undefined,
      targetRoleIds: undefined
    });
  });
});
