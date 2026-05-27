import { describe, expect, it } from 'vitest';
import { getFlowMessages, resolveFlowMessage } from '../i18n';

describe('flow i18n', () => {
  it('resolves zh-CN toolbar strings', () => {
    const messages = getFlowMessages('zh-CN');
    expect(resolveFlowMessage(messages, 'toolbar.zoomIn')).toBe('放大');
    expect(resolveFlowMessage(messages, 'emptyState.title')).toBe('画布为空');
  });

  it('resolves en-US with params', () => {
    const messages = getFlowMessages('en-US');
    expect(resolveFlowMessage(messages, 'node.ariaLabel', { label: 'Start' })).toBe('Node Start');
  });
});
