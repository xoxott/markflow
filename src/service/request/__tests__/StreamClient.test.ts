import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StreamClient } from '../stream/StreamClient';

function createSseResponse(body: string, status = 200): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(body));
      controller.close();
    }
  });

  return new Response(stream, {
    status,
    headers: { 'Content-Type': 'text/event-stream' }
  });
}

describe('StreamClient', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('calls onUnauthorized and reconnects after 401 when refresh succeeds', async () => {
    const onUnauthorized = vi.fn().mockResolvedValue(true);
    const getHeaders = vi.fn().mockReturnValue({ Authorization: 'Bearer token-a' });

    let fetchCount = 0;
    globalThis.fetch = vi.fn(async () => {
      fetchCount += 1;
      if (fetchCount === 1) {
        return new Response(null, { status: 401 });
      }
      return createSseResponse('data: {"type":"data","timestamp":"t","data":{"n":1}}\n\n', 200);
    }) as typeof fetch;

    const client = new StreamClient();
    client.configureAuth({ getHeaders, onUnauthorized });

    client.connect('test-conn', {
      url: 'http://localhost/stream',
      autoReconnect: false
    });

    await vi.waitFor(
      () => {
        expect(onUnauthorized).toHaveBeenCalledTimes(1);
        expect(client.getStatus('test-conn')).toBe('connected');
      },
      { timeout: 3000 }
    );

    client.disconnect('test-conn', true);
  });

  it('does not reconnect after 401 when refresh fails', async () => {
    const onUnauthorized = vi.fn().mockResolvedValue(false);

    globalThis.fetch = vi.fn(async () => new Response(null, { status: 401 })) as typeof fetch;

    const client = new StreamClient();
    client.configureAuth({
      getHeaders: () => ({ Authorization: 'Bearer x' }),
      onUnauthorized
    });

    client.connect('fail-conn', {
      url: 'http://localhost/stream',
      autoReconnect: true
    });

    await vi.waitFor(() => {
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
      expect(client.getStatus('fail-conn')).toBe('error');
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    client.disconnect('fail-conn', true);
  });

  it('merges getHeaders on each connection attempt', async () => {
    const getHeaders = vi
      .fn()
      .mockReturnValueOnce({ Authorization: 'Bearer old' })
      .mockReturnValue({ Authorization: 'Bearer new' });

    globalThis.fetch = vi.fn(async () =>
      createSseResponse('data: {"type":"heartbeat","timestamp":"t"}\n\n')
    ) as typeof fetch;

    const client = new StreamClient();
    client.configureAuth({ getHeaders });

    client.connect('hdr-conn', { url: 'http://localhost/stream', autoReconnect: false });

    await vi.waitFor(() => {
      expect(getHeaders).toHaveBeenCalled();
    });

    const init = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer old');

    client.disconnect('hdr-conn', true);
  });
});
