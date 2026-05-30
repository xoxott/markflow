import { watch } from 'vue';
import type { LocationQuery } from 'vue-router';
import { useRoute } from 'vue-router';

export type RouteQueryFieldMapping<T extends object> = {
  [queryKey: string]: {
    field: keyof T;
    parse?: (value: string) => T[keyof T];
  };
};

export type RouteQueryResolveFn<T extends object> = (
  query: LocationQuery,
  model: T
) => Promise<boolean>;

export interface RouteQueryConfig<T extends object> {
  mapping?: RouteQueryFieldMapping<T>;
  resolve?: RouteQueryResolveFn<T>;
  /** resolve 专用、不在 mapping 中的 query key（如 permissionId） */
  extraQueryKeys?: string[];
}

/** Collect URL query keys managed by routeQuery (mapping keys + extraQueryKeys). */
export function collectRouteQueryKeys<T extends object>(config: RouteQueryConfig<T>): string[] {
  const keys = new Set<string>(Object.keys(config.mapping ?? {}));
  config.extraQueryKeys?.forEach(key => keys.add(key));
  return [...keys];
}

/** Remove specified keys from route query; unrelated query params are preserved. */
export function clearRouteQuery(query: LocationQuery, keys: string[]): LocationQuery {
  if (keys.length === 0) {
    return query;
  }

  const keysToRemove = new Set(keys);
  return Object.fromEntries(
    Object.entries(query).filter(([key]) => !keysToRemove.has(key))
  ) as LocationQuery;
}

export function readRouteQueryValue(raw: LocationQuery[string]): string | undefined {
  if (raw === undefined || raw === null || raw === '') {
    return undefined;
  }

  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return String(value);
}

/** Apply known route query keys onto a search model. Returns whether any field changed. */
export function applyRouteQueryToModel<T extends object>(
  query: LocationQuery,
  model: T,
  mapping: RouteQueryFieldMapping<T>
): boolean {
  let changed = false;

  for (const [queryKey, config] of Object.entries(mapping)) {
    const value = readRouteQueryValue(query[queryKey]);
    if (value === undefined) {
      continue;
    }

    (model as Record<keyof T, T[keyof T]>)[config.field] = config.parse
      ? config.parse(value)
      : (value as T[keyof T]);
    changed = true;
  }

  return changed;
}

/** Apply route query (sync + optional async resolve) then invoke onApply. */
export async function applyRouteQueryFilters<T extends object>(
  query: LocationQuery,
  model: T,
  config: RouteQueryConfig<T>
): Promise<boolean> {
  const mapped = config.mapping ? applyRouteQueryToModel(query, model, config.mapping) : false;
  const resolved = config.resolve ? await config.resolve(query, model) : false;

  return mapped || resolved;
}

/** Watch route query changes and re-apply filters (same-page navigation). */
export function useRouteQueryWatcher<T extends object>(
  searchParams: T,
  config: RouteQueryConfig<T>,
  onApply: () => void
) {
  const route = useRoute();

  watch(
    () => route.query,
    async query => {
      if (await applyRouteQueryFilters(query, searchParams, config)) {
        onApply();
      }
    }
  );
}

export function parseQueryNumber(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function parseQueryBoolean(value: string): boolean | undefined {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
}
