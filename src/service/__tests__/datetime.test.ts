import { describe, expect, it, vi } from 'vitest';
import { formatApiDateTime, parseApiDateTime } from '@/utils/datetime';

vi.mock('@/utils/storage', () => ({
  localStg: {
    get: vi.fn(() => 'zh-CN'),
    set: vi.fn(),
    remove: vi.fn()
  }
}));

describe('datetime utils', () => {
  describe('parseApiDateTime', () => {
    it('parses ISO UTC with Z', () => {
      const d = parseApiDateTime('2026-05-29T01:18:49.105Z');
      expect(d).not.toBeNull();
      expect(d!.toISOString()).toBe('2026-05-29T01:18:49.105Z');
    });

    it('parses naive space-separated datetime', () => {
      const d = parseApiDateTime('2026-05-29 09:18:49');
      expect(d).not.toBeNull();
      expect(d!.isValid()).toBe(true);
    });

    it('returns null for empty or invalid', () => {
      expect(parseApiDateTime('')).toBeNull();
      expect(parseApiDateTime(null)).toBeNull();
      expect(parseApiDateTime('not-a-date')).toBeNull();
    });
  });

  describe('formatApiDateTime', () => {
    it('formats ISO UTC to local datetime string', () => {
      const formatted = formatApiDateTime('2026-05-29T01:18:49.105Z', {
        format: 'datetime',
        locale: 'zh-CN'
      });
      expect(formatted).toMatch(/2026-05-29/);
      expect(formatted).not.toBe('-');
    });

    it('returns emptyText for missing value', () => {
      expect(formatApiDateTime(undefined, { emptyText: '-' })).toBe('-');
    });

    it('formats date-only preset', () => {
      const formatted = formatApiDateTime('2026-05-29T01:18:49.105Z', {
        format: 'date',
        locale: 'zh-CN'
      });
      expect(formatted).toBe('2026-05-29');
    });
  });
});
