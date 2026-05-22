import { StreamClient } from './StreamClient';
import type { StreamAuthOptions } from './types';

export const streamClient = new StreamClient();

export function initStreamAuth(options: StreamAuthOptions): void {
  streamClient.configureAuth(options);
}

/** Fallback after shared token refresh — reconnects streams that were waiting on new auth */
export function reconnectAllStreams(): void {
  streamClient.reconnectAll();
}
