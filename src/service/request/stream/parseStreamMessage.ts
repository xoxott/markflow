/**
 * Parse SSE message from raw data string.
 *
 * Handles single and double-encoded JSON:
 *
 * - Single: {"type":"data","data":{...}}
 * - Double: {"data":"{"type":"data","data":{...}}"}
 */
export function parseStreamMessage(
  rawData: string,
  _connectionId: string
): Stream.StreamMessage | null {
  if (!rawData || !rawData.trim()) {
    return null;
  }

  try {
    let parsedData: unknown;

    try {
      parsedData = JSON.parse(rawData);
    } catch {
      return null;
    }

    if (
      parsedData &&
      typeof parsedData === 'object' &&
      'data' in parsedData &&
      typeof (parsedData as { data: unknown }).data === 'string' &&
      !('type' in parsedData)
    ) {
      try {
        parsedData = JSON.parse((parsedData as { data: string }).data);
      } catch {
        return null;
      }
    }

    if (parsedData && typeof parsedData === 'object' && 'type' in parsedData) {
      return parsedData as Stream.StreamMessage;
    }

    return null;
  } catch {
    return null;
  }
}
