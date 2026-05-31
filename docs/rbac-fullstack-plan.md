# RBAC 全栈实施方案（资源 · 菜单 · 权限）

> 仓库：`markflow`（前端） + `provide/ai-server`（NestJS 后端）  
> 导航域 **仅** 使用 `permissionCodes`；**禁止** menu/route `roleCodes` 及 `VITE_STATIC_SUPER_ROLE`。  
> 默认 **`VITE_AUTH_ROUTE_MODE=dynamic`**，路由由 `GET /api/admin/menus/user-routes` 下发。

---

## 架构要点

- **单一权限真相源**：ai-server `EffectivePermissionResolver` → JWT、`login/me`、`user-routes`
- **Resource → Permission → Menu**：Permission 绑 `resourceId`；Menu 绑 `permissionCodes[]`
- **超管**：种子 `*:*` permission，前端 `isSuperPermission()` 放行
- **保留（非导航）**：`User.roles[]`、manageability `roleCode`、JWT `@Roles`

详见 ai-server [`docs/architecture/rbac-navigation.md`](../../ai-server/docs/architecture/rbac-navigation.md)

---

## 联调检查清单

```text
[ ] ai-server: pnpm migration:run && pnpm seed:run
[ ] GET /api/admin/resources → 200
[ ] POST /api/admin/permissions { resourceId, action } → code 自动生成
[ ] login-step2.user.permissionCodes 非空
[ ] GET /api/admin/menus/tree → permissionCodes（无 roleCodes）
[ ] 菜单管理「同步路由」发送 registry（含 component）
[ ] GET /api/admin/menus/user-routes → 按权限过滤
[ ] markflow VITE_AUTH_ROUTE_MODE=dynamic
[ ] 无权限用户直链 → 403
[ ] super_admin / *:* → 全部可见
```

---

## API 契约

[`docs/api/rbac-backend-spec.md`](./api/rbac-backend-spec.md)

---

## static fallback（非主路径）

`build/plugins/router.ts` 在 `onRouteMetaGen` 从 `ROUTE_DEFAULT_PERMISSION_CODES` 注入 `meta.permissionCodes`，供 `VITE_AUTH_ROUTE_MODE=static` 开发时使用。
