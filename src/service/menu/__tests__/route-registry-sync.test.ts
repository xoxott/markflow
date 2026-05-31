import { describe, expect, it } from 'vitest';
import { buildSyncRegistryPayload } from '../route-registry-sync';

describe('buildSyncRegistryPayload', () => {
  it('uses routeKey as fallback title instead of localized text', () => {
    const payload = buildSyncRegistryPayload();
    const knowledgeBase = payload.find(item => item.routeKey === 'knowledge-base');
    const documents = payload.find(item => item.routeKey === 'knowledge-base-documents');

    expect(knowledgeBase?.title).toBe('knowledge-base');
    expect(knowledgeBase?.i18nKey).toBe('route.knowledge-base');
    expect(documents?.title).toBe('knowledge-base-documents');
    expect(documents?.i18nKey).toBe('route.knowledge-base-documents');
  });
});
