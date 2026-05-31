import { describe, expect, it, vi } from 'vitest';
import { buildSyncRegistryPayload } from '../route-registry-sync';

vi.mock('@/locales', () => ({
  $t: (key: string) => {
    const labels: Record<string, string> = {
      'route.file-manager': '知识库',
      'route.file-manager-documents': '知识库文档'
    };
    return labels[key] ?? key;
  }
}));

describe('buildSyncRegistryPayload', () => {
  it('uses localized title for routes with i18nKey', () => {
    const payload = buildSyncRegistryPayload();
    const fileManager = payload.find(item => item.routeKey === 'file-manager');
    const documents = payload.find(item => item.routeKey === 'file-manager-documents');

    expect(fileManager?.title).toBe('知识库');
    expect(documents?.title).toBe('知识库文档');
  });
});
