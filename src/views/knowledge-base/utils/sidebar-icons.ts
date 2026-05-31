import type { Component } from 'vue';
import { markRaw } from 'vue';
import type { TreeOption } from 'naive-ui';
import {
  AlertTriangle,
  Archive,
  Clock,
  File,
  FileText,
  Files,
  Loader,
  Photo,
  Video
} from '@vicons/tabler';
import type { QuickAccessItem } from '@/components/file-explorer/layout/FileSidebar';

const ICON_MAP: Record<string, Component> = {
  'files': markRaw(Files),
  'clock': markRaw(Clock),
  'alert-triangle': markRaw(AlertTriangle),
  'loader': markRaw(Loader),
  'file-text': markRaw(FileText),
  'photo': markRaw(Photo),
  'video': markRaw(Video),
  'archive': markRaw(Archive),
  'file': markRaw(File)
};

export function mapSidebarItems(items: Api.KnowledgeBase.SidebarItem[]): QuickAccessItem[] {
  return items.map(item => ({
    id: item.id,
    label: item.label,
    path: item.path,
    count: item.count,
    icon: ICON_MAP[item.icon] ?? File
  }));
}

export function mapFolderTree(nodes: Api.KnowledgeBase.SidebarTreeNode[]): TreeOption[] {
  return nodes.map(node => ({
    key: node.key,
    label: node.label,
    children: node.children?.length ? mapFolderTree(node.children) : undefined
  }));
}
