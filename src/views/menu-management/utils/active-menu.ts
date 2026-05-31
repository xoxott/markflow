import type { TreeSelectOption } from 'naive-ui';
import type { MenuTreeNode } from '../types';

export interface ActiveMenuTreeOptionsConfig {
  /** sidebarKey of the menu being edited (exclude self). */
  excludeSidebarKey?: string;
  /** Menu id of the node being edited. */
  excludeMenuId?: string;
}

export function findMenuNodeBySidebarKey(
  nodes: MenuTreeNode[],
  sidebarKey: string
): MenuTreeNode | null {
  for (const node of nodes) {
    if (node.sidebarKey === sidebarKey) return node;
    if (node.children?.length) {
      const found = findMenuNodeBySidebarKey(node.children, sidebarKey);
      if (found) return found;
    }
  }
  return null;
}

function isRouteActiveMenuCandidate(
  node: MenuTreeNode,
  config: ActiveMenuTreeOptionsConfig
): boolean {
  return (
    node.type === 'route' &&
    Boolean(node.routeKey?.trim()) &&
    !node.hideInMenu &&
    node.isActive &&
    node.sidebarKey !== config.excludeSidebarKey &&
    node.id !== config.excludeMenuId
  );
}

function isGroupActiveMenuCandidate(
  node: MenuTreeNode,
  config: ActiveMenuTreeOptionsConfig
): boolean {
  return node.type === 'group' && node.isActive && node.id !== config.excludeMenuId;
}

/** Tree options for picking a sidebar highlight target (`activeMenu` = sidebarKey). */
export function buildActiveMenuTreeOptions(
  nodes: MenuTreeNode[],
  config: ActiveMenuTreeOptionsConfig = {}
): TreeSelectOption[] {
  const mapNodes = (items: MenuTreeNode[]): TreeSelectOption[] =>
    items.flatMap((node): TreeSelectOption[] => {
      if (node.type === 'group') {
        const children = mapNodes(node.children ?? []);
        const groupSelectable = isGroupActiveMenuCandidate(node, config);

        if (!children.length) {
          if (!groupSelectable) return [];
          return [{ key: node.sidebarKey, label: node.name, disabled: false }];
        }

        if (!groupSelectable) {
          return [
            {
              key: `group:${node.sidebarKey}`,
              label: node.name,
              disabled: true,
              children
            }
          ];
        }

        return [
          {
            key: node.sidebarKey,
            label: node.name,
            disabled: false,
            children
          }
        ];
      }

      if (!isRouteActiveMenuCandidate(node, config) || !node.routeKey) return [];

      return [
        {
          key: node.sidebarKey,
          label: node.name,
          disabled: false
        }
      ];
    });

  return mapNodes(nodes);
}

/** Resolve activeMenu value (sidebarKey) to a display label. */
export function resolveActiveMenuLabel(
  nodes: MenuTreeNode[],
  value: string | null | undefined
): string {
  if (!value?.trim()) return '-';
  const found = findMenuNodeBySidebarKey(nodes, value);
  if (found) return found.name;
  return value;
}
