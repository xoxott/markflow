const QUICK_ACCESS_PREFIX = '@quick:';
const FILE_TYPE_PREFIX = '@type:';

export function isVirtualSidebarPath(path: string): boolean {
  return path.startsWith(QUICK_ACCESS_PREFIX) || path.startsWith(FILE_TYPE_PREFIX);
}

export function parseQuickAccess(path: string): Api.KnowledgeBase.QuickAccessKey | undefined {
  if (!path.startsWith(QUICK_ACCESS_PREFIX)) return undefined;
  return path.slice(QUICK_ACCESS_PREFIX.length) as Api.KnowledgeBase.QuickAccessKey;
}

export function parseFileType(path: string): Api.KnowledgeBase.FileTypeKey | undefined {
  if (!path.startsWith(FILE_TYPE_PREFIX)) return undefined;
  return path.slice(FILE_TYPE_PREFIX.length) as Api.KnowledgeBase.FileTypeKey;
}
