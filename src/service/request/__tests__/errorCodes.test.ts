import { describe, expect, it } from 'vitest';
import { isSessionCredentialError } from '../policies/errorCodes';

describe('isSessionCredentialError', () => {
  it('识别 1200/1201', () => {
    expect(isSessionCredentialError('1200')).toBe(true);
    expect(isSessionCredentialError('1201')).toBe(true);
    expect(isSessionCredentialError('1202')).toBe(false);
  });
});
