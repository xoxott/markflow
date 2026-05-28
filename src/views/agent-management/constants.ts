/** 智能体管理常量 */

export const AGENT_TYPE_PATTERN = /^[a-z][a-z0-9-]*$/;

export const AGENT_SOURCE_OPTIONS = [
  { label: '内置', value: 'builtin' as const },
  { label: '自定义', value: 'custom' as const },
  { label: '插件', value: 'plugin' as const }
];

export const AGENT_STATUS_OPTIONS = [
  { label: '草稿', value: 'draft' as const },
  { label: '已发布', value: 'published' as const },
  { label: '已停用', value: 'disabled' as const }
];

export const PERMISSION_MODE_OPTIONS = [
  { label: '冒泡 (bubble)', value: 'bubble' as const },
  { label: '自动 (auto)', value: 'auto' as const }
];

export const STRUCTURED_PERMISSION_OPTIONS = [
  { label: 'default', value: 'default' as const },
  { label: 'plan', value: 'plan' as const },
  { label: 'acceptEdits', value: 'acceptEdits' as const },
  { label: 'bypassPermissions', value: 'bypassPermissions' as const },
  { label: 'auto', value: 'auto' as const },
  { label: 'restricted', value: 'restricted' as const }
];

export const BACKGROUND_OPTIONS = [
  { label: '前台', value: 'foreground' as const },
  { label: '后台', value: 'background' as const }
];

export const ISOLATION_OPTIONS = [
  { label: 'worktree', value: 'worktree' as const },
  { label: 'remote', value: 'remote' as const },
  { label: 'shared', value: 'shared' as const }
];

export const MEMORY_SCOPE_OPTIONS = [
  { label: 'user', value: 'user' as const },
  { label: 'project', value: 'project' as const },
  { label: 'local', value: 'local' as const }
];

/** 常用工具预设（对齐 builtin agents） */
export const TOOL_PRESETS = [
  'read',
  'glob',
  'grep',
  'search',
  'ls',
  'file-read',
  'file-search',
  'bash',
  'write',
  'edit',
  'task',
  'web-fetch'
];

export const SKILL_PRESETS = ['frontend-patterns', 'e2e-testing', 'accessibility', 'seo'];

export const MCP_SERVER_PRESETS = ['git', 'filesystem', 'browser', 'database'];
