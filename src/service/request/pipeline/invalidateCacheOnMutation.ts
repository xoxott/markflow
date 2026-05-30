/** 写操作成功后，按 URL 收集需失效的 GET 缓存/去重键前缀 */

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function isMutationMethod(method: string | undefined): boolean {
  return MUTATION_METHODS.has((method || 'GET').toUpperCase());
}

/**
 * 解析 REST 集合根路径（无 query）。
 *
 * 约定：本项目管理端 API 形如 `/api/{scope}/{resource}/...`（如 `/api/admin/users`）， 写操作成功后需失效该 resource
 * 下的列表/详情/子 action 等 GET 缓存。
 *
 * 仅当路径深度超过集合根（≥4 段）时返回集合根；直接在集合上的写操作返回 null，只失效自身路径。
 */
export function resolveApiCollectionPath(path: string): string | null {
  const segments = path.split('?')[0]?.split('/').filter(Boolean) ?? [];

  if (segments[0] !== 'api' || segments.length < 4) {
    return null;
  }

  return `/${segments.slice(0, 3).join('/')}`;
}

/** 从 mutation URL 起，沿父路径向上收集需失效的路径，直至 REST 集合根（含） */
export function collectInvalidationUrlPaths(url: string): string[] {
  const path = url.split('?')[0] || '';
  if (!path) {
    return [];
  }

  const paths = [path];
  const collectionPath = resolveApiCollectionPath(path);

  if (!collectionPath || path === collectionPath) {
    return paths;
  }

  let current = path;

  while (current !== collectionPath) {
    const parent = current.replace(/\/[^/]+$/, '');
    if (!parent || parent === current) {
      break;
    }

    paths.push(parent);
    current = parent;
  }

  return paths;
}

/** 合并自动推断与请求显式声明的失效路径（去重，去掉 query） */
export function mergeInvalidationUrlPaths(url: string, explicitPaths?: string[]): string[] {
  const merged = new Set(collectInvalidationUrlPaths(url));

  for (const item of explicitPaths ?? []) {
    const normalized = item.split('?')[0];
    if (normalized) {
      merged.add(normalized);
    }
  }

  return Array.from(merged);
}

/** GET 请求在 generateKey / ctx.id 中的前缀 */
export function getGetRequestKeyPrefix(urlPath: string): string {
  return `GET_${urlPath}`;
}
