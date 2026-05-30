type AdminOptionResource = Api.AdminReference.AdminOptionResource;

/** 将 query 对象序列化为稳定 cache key（仅含已传字段，按 key 排序） */
export function buildAdminOptionCacheKey(
  resource: AdminOptionResource,
  params: Record<string, unknown>
): string {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([a], [b]) => a.localeCompare(b));

  return `${resource}:${JSON.stringify(entries)}`;
}
