import { NBadge, NButton, NDropdown, NPopover, NSpace, NSwitch, NTag, NText } from 'naive-ui';
import type { DropdownOption } from 'naive-ui';
import { createQueryBooleanSelectOptions } from '@/constants/queryBoolean';
import { formatApiDateTime } from '@/utils/datetime';
import type { SearchFieldConfig, TableColumnConfig } from '@/components/table-page/types';
import { $t } from '@/locales';

type User = Api.UserManagement.User;

const SORT_BY_OPTIONS = [
  { label: () => $t('page.userManagement.createdAt'), value: 'createdAt' },
  { label: () => $t('page.userManagement.lastLoginAt'), value: 'lastLoginAt' },
  { label: () => $t('page.userManagement.lastActivityAt'), value: 'lastActivityAt' },
  { label: () => $t('page.userManagement.username'), value: 'username' }
];

/** 静态筛选项 + 角色下拉（选项由接口数据在页面侧传入） */
export function createUserSearchFields(roles: Api.UserManagement.Role[]): SearchFieldConfig[] {
  return [
    {
      type: 'input',
      field: 'search',
      label: $t('common.searchFieldLabel'),
      placeholder: $t('page.userManagement.searchPlaceholder'),
      icon: 'i-carbon-search',
      width: '220px'
    },
    {
      type: 'select',
      field: 'isActive',
      label: $t('page.userManagement.status'),
      placeholder: $t('page.userManagement.statusPlaceholder'),
      width: '130px',
      options: createQueryBooleanSelectOptions(
        $t('page.userManagement.active'),
        $t('page.userManagement.inactive')
      )
    },
    {
      type: 'select',
      field: 'isOnline',
      label: $t('page.userManagement.onlineStatus'),
      placeholder: $t('page.userManagement.onlineStatusPlaceholder'),
      width: '130px',
      options: createQueryBooleanSelectOptions(
        $t('page.userManagement.online'),
        $t('page.userManagement.offline')
      )
    },
    {
      type: 'select',
      field: 'isBlacklisted',
      label: $t('page.userManagement.blacklistStatus'),
      placeholder: $t('page.userManagement.blacklistStatusPlaceholder'),
      width: '130px',
      options: createQueryBooleanSelectOptions(
        $t('page.userManagement.blacklisted'),
        $t('page.userManagement.notBlacklisted')
      )
    },
    {
      type: 'select',
      field: 'roleCode',
      label: $t('page.userManagement.role'),
      placeholder: $t('page.userManagement.rolePlaceholder'),
      width: '130px',
      options: roles.map(role => ({
        label: role.name,
        value: role.code
      }))
    },
    {
      type: 'select',
      field: 'sortBy',
      label: $t('page.userManagement.sortByLabel'),
      placeholder: $t('page.userManagement.sortByLabel'),
      width: '130px',
      options: SORT_BY_OPTIONS.map(opt => ({
        label: typeof opt.label === 'function' ? opt.label() : opt.label,
        value: opt.value
      }))
    },
    {
      type: 'select',
      field: 'sortOrder',
      label: $t('page.userManagement.sortOrderLabel'),
      placeholder: $t('page.userManagement.sortOrderLabel'),
      width: '130px',
      options: [
        { label: $t('page.userManagement.sortAsc'), value: 'asc' },
        { label: $t('page.userManagement.sortDesc'), value: 'desc' }
      ]
    }
  ];
}

export interface UserTableColumnHandlers {
  onDetail: (row: User) => void;
  onEdit: (row: User) => void;
  onDelete: (row: User) => void;
  onToggleStatus: (id: number, isActive: boolean) => void;
  onAssignRoles: (row: User) => void;
  onBlacklist: (row: User) => void;
  onUnblacklist: (row: User) => void;
  onKick: (row: User) => void;
}

function buildRowActionOptions(row: User): DropdownOption[] {
  const options: DropdownOption[] = [
    { label: $t('page.userManagement.userDetail'), key: 'detail' },
    { label: $t('common.edit'), key: 'edit' },
    { label: $t('page.userManagement.assignRoles'), key: 'assignRoles' }
  ];

  if (row.isBlacklisted) {
    options.push({ label: $t('page.userManagement.unblacklist'), key: 'unblacklist' });
  } else {
    options.push({ label: $t('page.userManagement.blacklist'), key: 'blacklist' });
  }

  if (row.isOnline) {
    options.push({ label: $t('page.userManagement.kickOffline'), key: 'kick' });
  }

  options.push({ type: 'divider', key: 'divider' });
  options.push({ label: $t('common.delete'), key: 'delete' });

  return options;
}

function handleRowAction(key: string, row: User, h: UserTableColumnHandlers) {
  switch (key) {
    case 'detail':
      h.onDetail(row);
      break;
    case 'edit':
      h.onEdit(row);
      break;
    case 'assignRoles':
      h.onAssignRoles(row);
      break;
    case 'blacklist':
      h.onBlacklist(row);
      break;
    case 'unblacklist':
      h.onUnblacklist(row);
      break;
    case 'kick':
      h.onKick(row);
      break;
    case 'delete':
      h.onDelete(row);
      break;
    default:
      break;
  }
}

export function createUserTableColumns(h: UserTableColumnHandlers): TableColumnConfig<User>[] {
  return [
    {
      title: $t('page.userManagement.username'),
      key: 'username',
      width: 140,
      fixed: 'left',
      ellipsis: {
        tooltip: true
      },
      render: (row: User) => (
        <NSpace size="small" align="center">
          <div
            class="flex cursor-pointer items-center gap-6px hover:text-primary"
            onClick={() => h.onDetail(row)}
          >
            {row.avatar ? (
              <img
                src={row.avatar}
                alt={row.username}
                class="h-28px w-28px rounded-full object-cover"
              />
            ) : (
              <div class="h-28px w-28px flex items-center justify-center rounded-full bg-primary text-12px text-white font-500">
                {row.username.charAt(0).toUpperCase()}
              </div>
            )}
            <NText strong>{row.username}</NText>
          </div>
        </NSpace>
      )
    },
    {
      title: $t('page.userManagement.email'),
      key: 'email',
      width: 200,
      ellipsis: {
        tooltip: true
      }
    },
    {
      title: $t('page.userManagement.role'),
      key: 'roles',
      width: 180,
      render: (row: User) => {
        if (!row.roles || row.roles.length === 0) {
          return <NText depth={3}>-</NText>;
        }
        if (row.roles.length === 1) {
          return (
            <NTag type="info" size="small" round>
              {row.roles[0].name}
            </NTag>
          );
        }
        return (
          <NPopover trigger="hover" placement="top">
            {{
              trigger: () => (
                <NBadge value={row.roles.length} type="info">
                  <NTag type="info" size="small" round>
                    {row.roles[0].name}
                  </NTag>
                </NBadge>
              ),
              default: () => (
                <NSpace size="small" vertical>
                  {row.roles.map((role: Api.UserManagement.Role) => (
                    <NTag key={role.id} type="info" size="small" round>
                      {role.name}
                    </NTag>
                  ))}
                </NSpace>
              )
            }}
          </NPopover>
        );
      }
    },
    {
      title: $t('page.userManagement.status'),
      key: 'isActive',
      width: 90,
      render: (row: User) => (
        <NSwitch
          value={row.isActive}
          onUpdateValue={value => h.onToggleStatus(row.id, value)}
          size="small"
        />
      )
    },
    {
      title: $t('page.userManagement.onlineStatus'),
      key: 'isOnline',
      width: 100,
      render: (row: User) => (
        <div class="flex items-center gap-6px">
          <div
            class={`w-6px h-6px rounded-full ${row.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
          />
          <NText depth={row.isOnline ? 1 : 3}>
            {row.isOnline ? $t('page.userManagement.online') : $t('page.userManagement.offline')}
          </NText>
        </div>
      )
    },
    {
      title: $t('page.userManagement.blacklistStatus'),
      key: 'isBlacklisted',
      width: 100,
      render: (row: User) => {
        if (row.isBlacklisted) {
          return (
            <NPopover trigger="hover" placement="top">
              {{
                trigger: () => (
                  <NTag type="error" size="small" round>
                    {$t('page.userManagement.blacklisted')}
                  </NTag>
                ),
                default: () => (
                  <div class="max-w-300px">
                    {row.blacklistReason && (
                      <div class="mb-4px">
                        <NText strong>{$t('page.userManagement.blacklistReasonLabel')}: </NText>
                        <NText>{row.blacklistReason}</NText>
                      </div>
                    )}
                    {row.blacklistedAt && (
                      <div>
                        <NText depth={3} class="text-12px">
                          {formatApiDateTime(row.blacklistedAt)}
                        </NText>
                      </div>
                    )}
                  </div>
                )
              }}
            </NPopover>
          );
        }
        return (
          <NTag type="success" size="small" round>
            {$t('page.userManagement.notBlacklisted')}
          </NTag>
        );
      }
    },
    {
      title: $t('page.userManagement.lastLoginAt'),
      key: 'lastLoginAt',
      width: 160,
      render: 'date',
      renderConfig: { format: 'smart', emptyText: $t('page.userManagement.neverLoggedIn') }
    },
    {
      title: $t('page.userManagement.lastActivityAt'),
      key: 'lastActivityAt',
      width: 160,
      render: 'date',
      renderConfig: { format: 'smart', emptyText: $t('page.userManagement.neverActive') }
    },
    {
      title: $t('page.userManagement.createdAt'),
      key: 'createdAt',
      width: 160,
      render: 'date',
      renderConfig: { format: 'datetime' }
    },
    {
      title: $t('common.operate'),
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (row: User) => (
        <NDropdown
          trigger="click"
          options={buildRowActionOptions(row)}
          onSelect={(key: string) => handleRowAction(key, row, h)}
        >
          <NButton size="small" type="primary" secondary>
            <div class="flex items-center gap-4px">
              <div class="i-carbon-overflow-menu-horizontal text-14px" />
              <span>{$t('common.operate')}</span>
            </div>
          </NButton>
        </NDropdown>
      )
    }
  ];
}

export const USER_LIST_SCROLL_X = 1900;
