import { describe, expect, it } from 'vitest';
import {
  collectInvalidationUrlPaths,
  getGetRequestKeyPrefix,
  isMutationMethod
} from '../pipeline/invalidateCacheOnMutation';

describe('invalidateCacheOnMutation', () => {
  it('isMutationMethod 识别写方法', () => {
    expect(isMutationMethod('POST')).toBe(true);
    expect(isMutationMethod('patch')).toBe(true);
    expect(isMutationMethod('GET')).toBe(false);
  });

  it('collectInvalidationUrlPaths 含父路径', () => {
    expect(collectInvalidationUrlPaths('/api/admin/roles/12')).toEqual([
      '/api/admin/roles/12',
      '/api/admin/roles'
    ]);
    expect(collectInvalidationUrlPaths('/api/admin/roles?page=1')).toEqual([
      '/api/admin/roles',
      '/api/admin'
    ]);
  });

  it('getGetRequestKeyPrefix 与 generateKey 前缀一致', () => {
    expect(getGetRequestKeyPrefix('/api/admin/roles')).toBe('GET_/api/admin/roles');
  });
});
