import type { MenuTreeStats, ParentGroupOption } from '../constants';
import type { MenuTreeNode } from '../types';

export function findMenuNode(nodes: MenuTreeNode[], id: string): MenuTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findMenuNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function findMenuPath(
  nodes: MenuTreeNode[],
  id: string,
  trail: MenuTreeNode[] = []
): MenuTreeNode[] {
  for (const node of nodes) {
    const nextTrail = [...trail, node];
    if (node.id === id) return nextTrail;
    if (node.children?.length) {
      const found = findMenuPath(node.children, id, nextTrail);
      if (found.length) return found;
    }
  }
  return [];
}

export function walkMenuTree(
  nodes: MenuTreeNode[],
  visitor: (node: MenuTreeNode, depth: number) => void,
  depth = 0
) {
  nodes.forEach(node => {
    visitor(node, depth);
    if (node.children?.length) walkMenuTree(node.children, visitor, depth + 1);
  });
}

export function collectTreeStats(nodes: MenuTreeNode[]): MenuTreeStats {
  const stats: MenuTreeStats = { total: 0, groups: 0, routes: 0, inactive: 0 };
  walkMenuTree(nodes, node => {
    stats.total += 1;
    if (node.type === 'group') stats.groups += 1;
    if (node.type === 'route') stats.routes += 1;
    if (!node.isActive) stats.inactive += 1;
  });
  return stats;
}

export function flattenGroupOptions(
  nodes: MenuTreeNode[],
  excludeId?: string
): ParentGroupOption[] {
  const options: ParentGroupOption[] = [];
  walkMenuTree(nodes, (node, depth) => {
    if (node.type !== 'group' || node.id === excludeId) return;
    const indent = depth > 0 ? `${'　'.repeat(depth)}└ ` : '';
    options.push({ label: `${indent}${node.name}`, value: node.id });
  });
  return options;
}

export function getAllExpandableKeys(nodes: MenuTreeNode[]): string[] {
  const keys: string[] = [];
  walkMenuTree(nodes, node => {
    if (node.children?.length) keys.push(node.id);
  });
  return keys;
}

export function isDescendant(nodes: MenuTreeNode[], ancestorId: string, nodeId: string): boolean {
  const ancestor = findMenuNode(nodes, ancestorId);
  if (!ancestor?.children?.length) return false;
  return Boolean(findMenuNode(ancestor.children, nodeId));
}

export function filterMenuTree(nodes: MenuTreeNode[], keyword: string): MenuTreeNode[] {
  const query = keyword.trim().toLowerCase();
  if (!query) return nodes;

  const filterNodes = (items: MenuTreeNode[]): MenuTreeNode[] =>
    items.reduce<MenuTreeNode[]>((acc, node) => {
      const children = node.children?.length ? filterNodes(node.children) : [];
      const selfMatch =
        node.name.toLowerCase().includes(query) ||
        node.routeKey?.toLowerCase().includes(query) ||
        node.i18nKey?.toLowerCase().includes(query) ||
        node.icon?.toLowerCase().includes(query);

      if (selfMatch || children.length) {
        acc.push({
          ...node,
          children: children.length ? children : selfMatch ? node.children : undefined
        });
      }
      return acc;
    }, []);

  return filterNodes(nodes);
}

export function canDropMenu(
  nodes: MenuTreeNode[],
  dragId: string,
  targetId: string,
  position: 'before' | 'inside' | 'after'
): boolean {
  if (dragId === targetId) return false;
  if (isDescendant(nodes, dragId, targetId)) return false;

  const targetNode = findMenuNode(nodes, targetId);
  if (!targetNode) return false;
  if (position === 'inside' && targetNode.type !== 'group') return false;

  return true;
}
