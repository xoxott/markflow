import { nextTick, ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAdminOptionCacheKey, useAdminOptionStore } from '@/store/modules/admin-option';
import {
  buildPresetOptionsFromTargets,
  buildPresetOptionsFromValues,
  hasAdminSelectBoundValue,
  mergeAdminOptionItems
} from '@/hooks/admin/adminOptionUtils';
import { fetchAdminOptions } from '@/hooks/admin/fetchAdminOptions';
import { mapOptionsToUi } from '@/hooks/admin/normalizeOptions';
import { useAdminRemoteOptions } from '@/hooks/admin/useAdminRemoteOptions';
import type { UiOptionItem } from '@/hooks/admin/types';

const fetchAdminRoleOptionsMock = vi.fn();

vi.mock('@/service/api/admin-reference', () => ({
  fetchAdminRoleOptions: (...args: unknown[]) => fetchAdminRoleOptionsMock(...args),
  fetchAdminUserOptions: (...args: unknown[]) => fetchAdminRoleOptionsMock(...args),
  fetchAdminPermissionOptions: (...args: unknown[]) => fetchAdminRoleOptionsMock(...args)
}));

describe('buildAdminOptionCacheKey', () => {
  it('builds stable key from query params', () => {
    expect(
      buildAdminOptionCacheKey('roles', {
        search: 'admin',
        limit: 50,
        includeDisabled: false,
        isSystem: true
      })
    ).toBe('roles:[["includeDisabled",false],["isSystem",true],["limit",50],["search","admin"]]');
  });

  it('uses empty entries for omitted params', () => {
    expect(buildAdminOptionCacheKey('users', {})).toBe('users:[]');
  });
});

describe('mapOptionsToUi', () => {
  const raw = {
    items: [
      { value: 1, label: 'Admin', code: 'admin', disabled: false },
      { value: 2, label: 'User', code: 'user', disabled: false }
    ],
    total: 2
  };

  it('valueKey=value keeps entity id', () => {
    expect(mapOptionsToUi(raw, 'value')).toEqual([
      { value: 1, label: 'Admin', disabled: false },
      { value: 2, label: 'User', disabled: false }
    ]);
  });

  it('valueKey=code maps to item field', () => {
    expect(mapOptionsToUi(raw, 'code')).toEqual([
      { value: 'admin', label: 'Admin', disabled: false },
      { value: 'user', label: 'User', disabled: false }
    ]);
  });
});

describe('adminOptionUtils', () => {
  it('mergeAdminOptionItems dedupes by value with override winning', () => {
    const merged = mergeAdminOptionItems(
      [{ value: 1, label: 'Preset A' }],
      [
        { value: 1, label: 'Remote A' },
        { value: 2, label: 'Remote B' }
      ]
    );

    expect(merged).toEqual([
      { value: 1, label: 'Remote A' },
      { value: 2, label: 'Remote B' }
    ]);
  });

  it('buildPresetOptionsFromValues handles scalar and array', () => {
    expect(buildPresetOptionsFromValues(42)).toEqual([{ value: 42, label: '42' }]);
    expect(buildPresetOptionsFromValues(['a', 'b'])).toEqual([
      { value: 'a', label: 'a' },
      { value: 'b', label: 'b' }
    ]);
    expect(buildPresetOptionsFromValues(null)).toEqual([]);
  });

  it('hasAdminSelectBoundValue detects bound values', () => {
    expect(hasAdminSelectBoundValue(null)).toBe(false);
    expect(hasAdminSelectBoundValue([])).toBe(false);
    expect(hasAdminSelectBoundValue([1])).toBe(true);
    expect(hasAdminSelectBoundValue('admin')).toBe(true);
  });

  it('buildPresetOptionsFromTargets uses names when provided and ID fallback otherwise', () => {
    expect(buildPresetOptionsFromTargets([1, 2], [{ id: 1, name: 'Admin' }])).toEqual([
      { value: 1, label: 'Admin' },
      { value: 2, label: '2' }
    ]);
    expect(buildPresetOptionsFromTargets([], [{ id: 1, name: 'Admin' }])).toEqual([]);
    expect(buildPresetOptionsFromTargets([3], null)).toEqual([{ value: 3, label: '3' }]);
  });
});

describe('useAdminOptionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns cached data within TTL', () => {
    const store = useAdminOptionStore();
    const key = 'roles:[]';
    const data = { items: [{ value: 1, label: 'Admin', code: 'admin' }], total: 1 };

    store.setCached(key, data);
    expect(store.getCached(key)).toEqual(data);
  });

  it('expires cache after TTL', () => {
    const store = useAdminOptionStore();
    const key = 'roles:[]';
    const data = { items: [{ value: 1, label: 'Admin', code: 'admin' }], total: 1 };

    store.setCached(key, data, 1000);
    vi.advanceTimersByTime(1001);
    expect(store.getCached(key)).toBeNull();
  });

  it('invalidateResource clears matching entries only', () => {
    const store = useAdminOptionStore();
    store.setCached('roles:[]', { items: [], total: 0 });
    store.setCached('users:[]', { items: [], total: 0 });

    store.invalidateResource('roles');
    expect(store.getCached('roles:[]')).toBeNull();
    expect(store.getCached('users:[]')).not.toBeNull();

    store.invalidateResource('all');
    expect(store.getCached('users:[]')).toBeNull();
  });
});

describe('fetchAdminOptions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    fetchAdminRoleOptionsMock.mockReset();
    fetchAdminRoleOptionsMock.mockResolvedValue({
      data: { items: [{ value: 1, label: 'A', code: 'a' }], total: 1 },
      error: null
    });
  });

  it('hits cache for identical query without second network call', async () => {
    const store = useAdminOptionStore();
    const params = { limit: 50, includeDisabled: false };

    await fetchAdminOptions('roles', params, store);
    await fetchAdminOptions('roles', params, store);

    expect(fetchAdminRoleOptionsMock).toHaveBeenCalledTimes(1);
  });

  it('refetches after invalidateResource', async () => {
    const store = useAdminOptionStore();
    const params = { limit: 50, includeDisabled: false };

    await fetchAdminOptions('roles', params, store);
    store.invalidateResource('roles');
    await fetchAdminOptions('roles', params, store);

    expect(fetchAdminRoleOptionsMock).toHaveBeenCalledTimes(2);
  });

  it('returns failed flag on network error', async () => {
    fetchAdminRoleOptionsMock.mockResolvedValueOnce({ data: null, error: new Error('fail') });

    const result = await fetchAdminOptions('roles', { limit: 50 }, useAdminOptionStore());
    expect(result.failed).toBe(true);
    expect(result.data.items).toEqual([]);
  });

  it('forwards resource-specific query params', async () => {
    await fetchAdminOptions('roles', { limit: 50, isSystem: true }, useAdminOptionStore());

    expect(fetchAdminRoleOptionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ isSystem: true })
    );
    expect(fetchAdminRoleOptionsMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ valueKey: expect.anything(), valueField: expect.anything() })
    );
  });
});

describe('useAdminRemoteOptions debounce', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    fetchAdminRoleOptionsMock.mockReset();
    fetchAdminRoleOptionsMock.mockResolvedValue({
      data: { items: [], total: 0 },
      error: null
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces search and only fetches once for rapid input', async () => {
    const remote = useAdminRemoteOptions('roles');

    remote.search('a');
    remote.search('ab');
    remote.search('abc');

    await vi.advanceTimersByTimeAsync(300);

    expect(fetchAdminRoleOptionsMock).toHaveBeenCalledTimes(1);
    expect(fetchAdminRoleOptionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'abc' })
    );
  });

  it('ignores stale responses when a newer search is in flight', async () => {
    let resolveFirst: (value: unknown) => void = () => {};
    const firstPromise = new Promise(resolve => {
      resolveFirst = resolve;
    });

    fetchAdminRoleOptionsMock
      .mockImplementationOnce(() => firstPromise)
      .mockResolvedValueOnce({
        data: {
          items: [{ value: 2, label: 'Latest', code: 'latest' }],
          total: 1
        },
        error: null
      });

    const remote = useAdminRemoteOptions('roles', { valueKey: 'code' });
    remote.search('slow');
    await vi.advanceTimersByTimeAsync(300);

    remote.search('fast');
    await vi.advanceTimersByTimeAsync(300);

    resolveFirst({
      data: { items: [{ value: 1, label: 'Stale', code: 'stale' }], total: 1 },
      error: null
    });
    await Promise.resolve();

    expect(remote.options.value).toEqual([{ value: 'latest', label: 'Latest' }]);
  });

  it('maps valueKey=code on client without API param', async () => {
    fetchAdminRoleOptionsMock.mockResolvedValueOnce({
      data: {
        items: [{ value: 1, label: 'Admin', code: 'admin' }],
        total: 1
      },
      error: null
    });

    const remote = useAdminRemoteOptions('roles', { valueKey: 'code' });
    await remote.loadInitial();

    expect(fetchAdminRoleOptionsMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ valueKey: expect.anything(), valueField: expect.anything() })
    );
    expect(remote.options.value).toEqual([{ value: 'admin', label: 'Admin' }]);
  });
});

describe('useAdminRemoteOptions presetOptions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    fetchAdminRoleOptionsMock.mockReset();
    fetchAdminRoleOptionsMock.mockResolvedValue({
      data: { items: [], total: 0 },
      error: null
    });
  });

  it('prefers presetOptions labels over presetValues placeholders', () => {
    const remote = useAdminRemoteOptions('roles', {
      presetValues: ref([1]),
      presetOptions: [{ value: 1, label: 'Admin Role' }]
    });

    expect(remote.options.value).toEqual([{ value: 1, label: 'Admin Role' }]);
  });

  it('falls back to presetValues when presetOptions is empty', () => {
    const remote = useAdminRemoteOptions('roles', {
      presetValues: ref([42]),
      presetOptions: []
    });

    expect(remote.options.value).toEqual([{ value: 42, label: '42' }]);
  });

  it('restores preset options after reset', async () => {
    const remote = useAdminRemoteOptions('roles', {
      presetValues: ref([2]),
      presetOptions: [{ value: 2, label: 'Editor' }]
    });

    await remote.loadInitial();
    expect(remote.options.value).toEqual([{ value: 2, label: 'Editor' }]);

    remote.reset();
    expect(remote.options.value).toEqual([{ value: 2, label: 'Editor' }]);
  });

  it('reacts when presetOptions ref changes', async () => {
    const presetOptionsRef = ref<UiOptionItem[]>([{ value: 1, label: 'First' }]);
    const remote = useAdminRemoteOptions('roles', {
      presetValues: ref([1]),
      presetOptions: presetOptionsRef
    });

    expect(remote.options.value).toEqual([{ value: 1, label: 'First' }]);

    presetOptionsRef.value = [{ value: 1, label: 'Updated' }];
    await nextTick();

    expect(remote.options.value).toEqual([{ value: 1, label: 'Updated' }]);
  });
});
