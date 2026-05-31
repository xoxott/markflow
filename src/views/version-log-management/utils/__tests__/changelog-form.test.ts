import { describe, expect, it } from 'vitest';
import {
  buildCreatePayload,
  buildUpdatePayload,
  createEmptyForm,
  isPrereleaseVersion,
  mapDetailToForm
} from '../changelog-form';

describe('isPrereleaseVersion', () => {
  it('matches ai-server Version.isPrerelease semantics', () => {
    expect(isPrereleaseVersion('1.0.0-beta')).toBe(true);
    expect(isPrereleaseVersion('v2.1.0-rc.1')).toBe(true);
    expect(isPrereleaseVersion('1.0.0')).toBe(false);
    expect(isPrereleaseVersion('invalid')).toBe(false);
  });
});

describe('buildCreatePayload', () => {
  it('maps all change types to backend changes array', () => {
    const form = {
      ...createEmptyForm(),
      version: '1.2.0-beta',
      title: 'Beta release',
      description: 'Summary',
      releaseDate: '2026-06-08T16:00:00.000Z',
      features: 'New dashboard',
      fixes: 'Login bug',
      improvements: 'Faster load',
      breaking: 'Removed legacy API',
      security: 'Patched XSS',
      deprecated: 'Old endpoint'
    };

    expect(buildCreatePayload(form)).toEqual({
      version: '1.2.0-beta',
      title: 'Beta release',
      description: 'Summary',
      releaseDate: '2026-06-08T16:00:00.000Z',
      changes: [
        { type: 'feature', description: 'New dashboard' },
        { type: 'fix', description: 'Login bug' },
        { type: 'improvement', description: 'Faster load' },
        { type: 'breaking', description: 'Removed legacy API' },
        { type: 'security', description: 'Patched XSS' },
        { type: 'deprecated', description: 'Old endpoint' }
      ]
    });
  });

  it('does not send isPrerelease and falls back to title when changes are empty', () => {
    const payload = buildCreatePayload({
      ...createEmptyForm(),
      version: '1.0.0',
      title: 'Initial release',
      releaseDate: '2026-06-08T16:00:00.000Z'
    });

    expect(payload).toEqual({
      version: '1.0.0',
      title: 'Initial release',
      description: undefined,
      releaseDate: '2026-06-08T16:00:00.000Z',
      changes: [{ type: 'improvement', description: 'Initial release' }]
    });
    expect('isPrerelease' in payload).toBe(false);
    expect('breakingChanges' in payload).toBe(false);
    expect('deprecations' in payload).toBe(false);
  });
});

describe('mapDetailToForm', () => {
  it('round-trips all supported change types', () => {
    const detail: Api.VersionLogManagement.VersionLog = {
      id: 1,
      version: '2.0.0',
      title: 'Major',
      description: 'Notes',
      changes: [
        { type: 'feature', description: 'A' },
        { type: 'fix', description: 'B' },
        { type: 'improvement', description: 'C' },
        { type: 'breaking', description: 'D' },
        { type: 'security', description: 'E' },
        { type: 'deprecated', description: 'F' }
      ],
      releaseDate: '2026-06-08T16:00:00.000Z',
      releasedBy: 1,
      isPrerelease: false,
      breakingChanges: ['D'],
      deprecations: ['F'],
      metadata: null,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
      hasBreakingChanges: true,
      hasDeprecations: true
    };

    expect(mapDetailToForm(detail)).toEqual({
      version: '2.0.0',
      title: 'Major',
      description: 'Notes',
      releaseDate: '2026-06-08T16:00:00.000Z',
      features: 'A',
      fixes: 'B',
      improvements: 'C',
      breaking: 'D',
      security: 'E',
      deprecated: 'F'
    });

    expect(buildUpdatePayload(mapDetailToForm(detail)).changes).toEqual(detail.changes);
  });
});
