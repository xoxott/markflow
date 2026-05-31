import { vi } from 'vitest';

vi.mock('@/locales', () => ({
  $t: (key: string) => key
}));

Object.defineProperty(window, '$message', {
  configurable: true,
  writable: true,
  value: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn()
  }
});
