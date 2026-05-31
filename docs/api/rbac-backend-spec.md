# RBAC 后端接口规范（ai-server）

> 全栈实施顺序见 [`../rbac-fullstack-plan.md`](../rbac-fullstack-plan.md)。  
> 本文档为 markflow 前端类型与 ai-server 接口的字段级对齐说明。

## Breaking Changes

- Menu DTO/DB **删除** `roleCodes`
- Menu 新增 `permissionCodes: string[]`
- `GET /api/admin/menus/user-routes` **不再**接受 `roleCodes` 参数，从 JWT 解析用户并服务端过滤
- Auth `UserInfo` 新增 `permissionCodes: string[]`
- Permission 创建改为 `resourceId + action`（不再要求客户端传完整 `code`）

## Resource

| Method | Path                           | Body / Query                                           |
| ------ | ------------------------------ | ------------------------------------------------------ |
| GET    | `/api/admin/resources`         | `page`, `limit`, `search`, `isActive`                  |
| POST   | `/api/admin/resources`         | `{ code, name, description? }`                         |
| GET    | `/api/admin/resources/:id`     |                                                        |
| PUT    | `/api/admin/resources/:id`     | `{ name?, description?, isActive? }` — **code 不可改** |
| DELETE | `/api/admin/resources/:id`     | 无关联 Permission 时可删                               |
| GET    | `/api/admin/resources/options` | `search`, `limit`, `includeDisabled`                   |

## Permission（调整）

- `POST /api/admin/permissions` — `{ name, resourceId, action, description? }`；`code` 由后端生成 `resourceCode:action`
- `GET /api/admin/permissions/options/actions` — 仍按 `resource`（code）筛 action
- `GET /api/admin/permissions/options/resources` — **Deprecated** → `/api/admin/resources/options`

## Menu

| Method   | Path                           | 说明                                           |
| -------- | ------------------------------ | ---------------------------------------------- |
| GET      | `/api/admin/menus/tree`        | 响应含 `permissionCodes`，无 `roleCodes`       |
| POST/PUT | `/api/admin/menus`             | 校验 `permissionCodes` 均存在于 permissions 表 |
| GET      | `/api/admin/menus/user-routes` | 服务端按 JWT 用户 permissionCodes 过滤         |
| POST     | `/api/admin/menus/sync-routes` | 同步前端 route registry                        |
| GET      | `/api/admin/routes/registry`   | 供菜单绑定 routeKey                            |

## Auth

| Method | Path                          | 变更                             |
| ------ | ----------------------------- | -------------------------------- |
| POST   | `/api/admin/auth/login-step2` | `user.permissionCodes: string[]` |
| GET    | `/api/admin/users/me`         | `permissionCodes: string[]`      |

## 标准 Action

`read | create | update | delete | assign | export | write`

（现有 seed 使用 `write`，新页面入口统一用 `read`。）

## 超管

super_admin 角色配置 `*:*` permission；前端 guard 识别后放行全部路由。
