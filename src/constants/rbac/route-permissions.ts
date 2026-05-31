import type { RouteKey } from '@elegant-router/types';

/** Default page-entry permission codes when syncing menus from route registry. */
export const ROUTE_DEFAULT_PERMISSION_CODES: Partial<Record<RouteKey, string[]>> = {
  'home': ['dashboard:read'],
  'ai-workflow': ['workflow:read'],
  'knowledge-base': ['file:read'],
  'monitoring': ['monitoring:read'],
  'agent-management': ['agent:read'],
  'model-profile-management': ['model-profile:read'],
  'agent-team-management': ['agent-team:read'],
  'agent-runtime': ['agent-runtime:read'],
  'user-management': ['user:read'],
  'role-management': ['role:read'],
  'permission-management': ['permission:read'],
  'resource-management': ['resource:read'],
  'announcement-management': ['announcement:read'],
  'notification-management': ['notification:read'],
  'alert-management': ['alert:read'],
  'menu-management': ['menu:read'],
  'log-management': ['log:read'],
  'version-log-management': ['changelog:read'],
  'component': ['component:read'],
  'mobile': ['mobile:read'],
  'upload': ['upload:read'],
  'utils': ['utils:read'],
  'chat': ['chat:read'],
  'markdownedit': ['markdown:read']
};

export function resolveDefaultPermissionCodes(routeKey: string): string[] {
  const codes = ROUTE_DEFAULT_PERMISSION_CODES[routeKey as RouteKey];
  return codes?.length ? [...codes] : [`${routeKey.replace(/-/g, '_')}:read`];
}
