export type StreamAuthOptions = {
  getHeaders: () => Record<string, string>;
  onUnauthorized?: () => Promise<boolean>;
};

export type ParseStreamMessageFn = (
  rawData: string,
  connectionId: string
) => Stream.StreamMessage | null;
