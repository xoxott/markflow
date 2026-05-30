import { describe, expect, it } from 'vitest';
import {
  collectInvalidationUrlPaths,
  getGetRequestKeyPrefix,
  isMutationMethod,
  mergeInvalidationUrlPaths,
  resolveApiCollectionPath
} from '../pipeline/invalidateCacheOnMutation';

describe('invalidateCacheOnMutation', () => {
  it('isMutationMethod 识别写方法', () => {
    expect(isMutationMethod('POST')).toBe(true);
    expect(isMutationMethod('patch')).toBe(true);
    expect(isMutationMethod('GET')).toBe(false);
  });

  it('resolveApiCollectionPath 识别 /api/{scope}/{resource} 集合根', () => {
    expect(resolveApiCollectionPath('/api/admin/users/123')).toBe('/api/admin/users');
    expect(resolveApiCollectionPath('/api/admin/users')).toBeNull();
    expect(resolveApiCollectionPath('/legacy/foo/bar')).toBeNull();
  });

  it('collectInvalidationUrlPaths 对详情资源失效至集合列表', () => {
    expect(collectInvalidationUrlPaths('/api/admin/roles/12')).toEqual([
      '/api/admin/roles/12',
      '/api/admin/roles'
    ]);
    expect(collectInvalidationUrlPaths('/api/admin/roles?page=1')).toEqual(['/api/admin/roles']);
  });

  it('collectInvalidationUrlPaths 对任意深度子路径失效至集合列表', () => {
    expect(collectInvalidationUrlPaths('/api/admin/users/123/activate')).toEqual([
      '/api/admin/users/123/activate',
      '/api/admin/users/123',
      '/api/admin/users'
    ]);
    expect(collectInvalidationUrlPaths('/api/admin/users/batch/status')).toEqual([
      '/api/admin/users/batch/status',
      '/api/admin/users/batch',
      '/api/admin/users'
    ]);
    expect(collectInvalidationUrlPaths('/api/admin/users/123/roles')).toEqual([
      '/api/admin/users/123/roles',
      '/api/admin/users/123',
      '/api/admin/users'
    ]);
  });

  it('mergeInvalidationUrlPaths 合并显式声明路径', () => {
    expect(mergeInvalidationUrlPaths('/legacy/custom/action', ['/legacy/custom/list'])).toEqual([
      '/legacy/custom/action',
      '/legacy/custom/list'
    ]);
  });

  it('getGetRequestKeyPrefix 与 generateKey 前缀一致', () => {
    expect(getGetRequestKeyPrefix('/api/admin/roles')).toBe('GET_/api/admin/roles');
  });
});
