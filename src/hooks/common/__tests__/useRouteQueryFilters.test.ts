import { describe, expect, it } from 'vitest';
import {
  applyRouteQueryToModel,
  clearRouteQuery,
  collectRouteQueryKeys,
  parseQueryNumber
} from '@/hooks/common/useRouteQueryFilters';

describe('collectRouteQueryKeys', () => {
  it('merges mapping keys and extraQueryKeys without duplicates', () => {
    expect(
      collectRouteQueryKeys({
        mapping: {
          roleId: { field: 'roleId', parse: parseQueryNumber },
          search: { field: 'search' }
        },
        extraQueryKeys: ['permissionId', 'roleId']
      })
    ).toEqual(['roleId', 'search', 'permissionId']);
  });

  it('returns empty array when config has no keys', () => {
    expect(collectRouteQueryKeys({})).toEqual([]);
  });
});

describe('clearRouteQuery', () => {
  it('removes only specified keys and preserves unrelated query params', () => {
    expect(
      clearRouteQuery({ roleId: '3', search: 'admin', tab: 'list' }, ['roleId', 'search'])
    ).toEqual({ tab: 'list' });
  });

  it('returns the same object reference when keys array is empty', () => {
    const query = { roleId: '3' };
    expect(clearRouteQuery(query, [])).toBe(query);
  });
});

describe('applyRouteQueryToModel', () => {
  it('applies mapped query values onto the search model', () => {
    const model = { search: '', roleId: undefined as number | undefined };

    const changed = applyRouteQueryToModel({ roleId: '5', search: 'alice' }, model, {
      roleId: { field: 'roleId', parse: parseQueryNumber },
      search: { field: 'search' }
    });

    expect(changed).toBe(true);
    expect(model).toEqual({ search: 'alice', roleId: 5 });
  });

  it('skips missing query keys without mutating the model', () => {
    const model = { search: 'keep', roleId: undefined as number | undefined };

    const changed = applyRouteQueryToModel({}, model, {
      roleId: { field: 'roleId', parse: parseQueryNumber },
      search: { field: 'search' }
    });

    expect(changed).toBe(false);
    expect(model).toEqual({ search: 'keep', roleId: undefined });
  });
});
