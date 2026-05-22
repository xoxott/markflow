import { describe, expect, it } from 'vitest';
import { parseStreamMessage } from '../stream/parseStreamMessage';

describe('parseStreamMessage', () => {
  it('returns null for empty input', () => {
    expect(parseStreamMessage('', 'conn-1')).toBeNull();
    expect(parseStreamMessage('   ', 'conn-1')).toBeNull();
  });

  it('parses single-encoded JSON message', () => {
    const raw = JSON.stringify({
      type: 'data',
      timestamp: '2024-01-01T00:00:00Z',
      data: { value: 1 }
    });

    const message = parseStreamMessage(raw, 'conn-1');
    expect(message).toEqual({
      type: 'data',
      timestamp: '2024-01-01T00:00:00Z',
      data: { value: 1 }
    });
  });

  it('parses double-encoded JSON message', () => {
    const inner = JSON.stringify({
      type: 'data',
      timestamp: '2024-01-01T00:00:00Z',
      data: { ok: true }
    });
    const raw = JSON.stringify({ data: inner });

    const message = parseStreamMessage(raw, 'conn-1');
    expect(message?.type).toBe('data');
    expect(message?.data).toEqual({ ok: true });
  });

  it('returns null for invalid JSON', () => {
    expect(parseStreamMessage('not-json', 'conn-1')).toBeNull();
  });
});
