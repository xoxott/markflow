/** 写操作成功后，按 URL 收集需失效的 GET 缓存/去重键前缀 */

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function isMutationMethod(method: string | undefined): boolean {
  return MUTATION_METHODS.has((method || 'GET').toUpperCase());
}

/** 返回需失效的 URL 路径（无 query），含资源详情时的父路径 */
export function collectInvalidationUrlPaths(url: string): string[] {
  const path = url.split('?')[0] || '';
  if (!path) {
    return [];
  }

  const paths = [path];
  const parent = path.replace(/\/[^/]+$/, '');

  if (parent && parent !== path) {
    paths.push(parent);
  }

  return paths;
}

/** GET 请求在 generateKey / ctx.id 中的前缀 */
export function getGetRequestKeyPrefix(urlPath: string): string {
  return `GET_${urlPath}`;
}
