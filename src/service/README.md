# 业务服务层约定

## 分层

| 层级               | 路径                                | 职责                                                                                                                                |
| ------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| HTTP 门面          | `src/service/request/index.ts`      | 装配：`createAxiosRequestStack` + 步骤链 + `createFlatRequestFromStack`；对外导出 `request` / `refreshTokenRequest` / `demoRequest` |
| 业务策略（拦截器） | `src/service/request/policies/*.ts` | 主站鉴权、业务码、Token 刷新与登出、Demo 后端形态等（**含业务逻辑**，属正常）                                                       |
| 横切管道           | `src/service/request/pipeline/`     | `buildPipelineSteps(transport, profile)`、`createPipelineClient`：缓存、去重、中止、队列、事件、重试、熔断；**profile** 见下        |
| 流式连接           | `src/service/request/stream/`       | `streamClient`（fetch SSE）：与 REST 共享 `buildServiceHeaders` / `handleExpiredRequest`，**不走** Pipeline                         |
| 领域 API           | `src/service/api/*.ts`              | 按资源拆分的函数（如 `fetchUserList`），内部只调 `request`；流式 endpoint 仅提供 path/url（如 `monitoring-stream.ts`）              |
| 页面 / 特性模块    | `src/views/*`、`src/components/*`   | **只**从 `@/service/api`（或具体 `./api/xxx`）引用方法，不直接依赖 `axios`                                                          |

### 管道 profile（`PipelineProfile`）

| 值          | 含义                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------- |
| `standard`  | 默认：缓存、去重、中止、队列、事件、熔断 + 传输（**不含**管道重试，列表等场景失败即结束） |
| `minimal`   | 仅 `PrepareContext` + `PipelineTransport`，适合调试或极轻场景                             |
| `resilient` | 在 `standard` 基础上启用 5xx 重试并提高队列并发（见 `pipeline/pipelineProfile.ts`）       |

主业务实例可通过环境变量 **`VITE_HTTP_PIPELINE_PROFILE`** 设为 `standard` | `resilient`（非法或未设则 `standard`）。`createPipelineClient({ pipelineProfile: 'minimal' })` 亦可单独指定。

`createPipelineResources` / `buildPipelineSteps` 对缓存/去重/队列/熔断（及 `resilient` 下的重试）传入 **`enabledByDefault: true`**，并共用同一个 `RequestCacheManager` 与 `DedupeManager`；`CacheWrite` 与 `MutationCacheInvalidateStep` 排在 `Transport` 之前（先 `next()` 发请求再写入/失效）。**写操作**（`POST` / `PUT` / `PATCH` / `DELETE`）成功后会按 URL（及父路径，如 `PATCH /roles/12` 同时失效列表 `GET /roles`）自动清理相关 GET 缓存与去重条目，页面 `getData()` 无需传 `cache: false`。极少数场景可在 axios config 上设 `cache: false` / `dedupe: false`（由 `runPipelineAxiosRequest` 写入 `ctx.meta`）。**会话边界**：切换账号或登出时，auth store 会调用 `clearMainRequestPipelineCache()`（见 `src/service/request/index.ts`），清空主业务管道的 GET 缓存与去重条目，避免跨用户命中上一会话数据；同用户 F5 刷新不受影响。`AxiosTransport` 向上抛出原始 `AxiosError`（保留 `response.status`），供 5xx 重试与熔断计数；`composeSteps` 为 `RetryStep` 注入可重入的后续链执行。GET 命中缓存时由 `runPipelineAxiosRequest` 合成 `AxiosResponse`。集成测试见 `src/service/request/__tests__/pipeline-axios.test.ts`。

## 页面怎么用

1. **默认**：`import { fetchUserList } from '@/service/api/user'` 或 `import { fetchUserList } from '@/service/api'`（统一从 barrel 导出时）。
2. **需要管道能力**（第三方演示、非标准后端等）：`import { createPipelineClient } from '@/service/request/pipeline'`，自行处理响应体与鉴权。
3. **SSE / 长连接**：`import { streamClient } from '@/service/request'` 或 `import { useStream } from '@/hooks/common/use-stream'`；业务 path 放在 `src/service/api/*-stream.ts`，鉴权由 `initStreamAuth` 在应用启动时注入（见 `request/index.ts`）。

### Stream（SSE）

- 使用 **fetch + ReadableStream**（支持自定义 `Authorization`，不用 `EventSource`）。
- 每次连接通过 `buildServiceHeaders()` 附带 token；HTTP 401 时走与 REST 相同的 `handleExpiredRequest`，成功后自动重连。
- 监控场景：`createMonitoringStreamConfig` + `useMonitoringSSE`（内部 `useStream`）。
- 测试：`src/service/request/__tests__/parseStreamMessage.test.ts`、`StreamClient.test.ts`。

主业务 `request` 已与共享 `AxiosInstance` 上的拦截器策略及默认步骤链合并；策略代码在 `policies/`，避免在 `index.ts` 堆叠过长逻辑。
