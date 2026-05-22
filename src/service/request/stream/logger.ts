/* eslint-disable no-console */

const isDevelopment = import.meta.env.DEV;
const isStreamDebugEnabled = import.meta.env.VITE_STREAM_DEBUG === 'true';

function isDebugEnabled(): boolean {
  return isDevelopment || isStreamDebugEnabled;
}

export const streamLogger = {
  debug: (...args: unknown[]) => {
    if (isDebugEnabled()) {
      console.log('[Stream]', ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDebugEnabled()) {
      console.log('[Stream]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    console.warn('[Stream]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[Stream]', ...args);
  }
};
