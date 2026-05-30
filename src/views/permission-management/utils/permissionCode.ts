/** Build backend permission code from resource and action facets. */
export function buildPermissionCode(resource: string, action: string): string {
  return `${resource.trim()}:${action.trim()}`.toLowerCase();
}
