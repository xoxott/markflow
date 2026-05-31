import { describe, expect, it } from 'vitest';
import { isAuthHttpStatus, resolveHttpStatus } from '../http-status';

describe('http-status', () => {
  it('resolveHttpStatus reads axios response status', () => {
    expect(resolveHttpStatus({ response: { status: 503 } })).toBe(503);
    expect(resolveHttpStatus({ status: 404 })).toBe(404);
    expect(resolveHttpStatus(null)).toBeUndefined();
  });

  it('isAuthHttpStatus matches 401 and 403 only', () => {
    expect(isAuthHttpStatus(401)).toBe(true);
    expect(isAuthHttpStatus(403)).toBe(true);
    expect(isAuthHttpStatus(500)).toBe(false);
    expect(isAuthHttpStatus(undefined)).toBe(false);
  });
});
