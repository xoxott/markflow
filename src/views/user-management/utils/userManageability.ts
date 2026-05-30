type User = Api.UserManagement.User;

/** 当前管理员是否可管理该用户（与 ai-server UserOutput.manageable 一致） */
export function isUserManageable(user: Pick<User, 'manageable'>): boolean {
  return user.manageable !== false;
}

/** 从列表数据中解析可管理的选中用户 ID */
export function filterManageableUserIds(users: User[], selectedIds: number[]): number[] {
  const userMap = new Map(users.map(user => [user.id, user]));

  return selectedIds.filter(id => {
    const user = userMap.get(id);
    return user !== null && user !== undefined && isUserManageable(user);
  });
}
