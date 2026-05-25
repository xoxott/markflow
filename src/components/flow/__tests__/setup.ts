/** Vitest 测试环境设置 */

import { vi } from 'vitest';

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

global.requestAnimationFrame = vi.fn(cb => {
  cb(Date.now());
  return 0;
});

global.cancelAnimationFrame = vi.fn();

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
})) as unknown as typeof IntersectionObserver;

if (!global.performance) {
  global.performance = {} as Performance;
}
if (typeof global.performance.now !== 'function') {
  global.performance.now = () => Date.now();
}
