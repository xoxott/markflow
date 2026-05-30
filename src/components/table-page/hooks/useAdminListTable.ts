import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DEFAULT_TABLE_PAGE_SIZE } from '@/constants/datatable';
import { useTable } from '@/hooks/common/table';
import {
  type RouteQueryConfig,
  applyRouteQueryFilters,
  applyRouteQueryToModel,
  clearRouteQuery,
  collectRouteQueryKeys,
  readRouteQueryValue,
  useRouteQueryWatcher
} from '@/hooks/common/useRouteQueryFilters';
import { tableListPlaceholderColumns } from '@/views/_shared/tableListPlaceholderColumns';

type ListParams<A extends NaiveUI.TableApiFn> = Parameters<A>[0];
type ListFilters<A extends NaiveUI.TableApiFn> = Omit<ListParams<A>, 'page' | 'limit'>;

/**
 * 后台「TablePage + 占位列 + useTable」列表的统一入口：
 *
 * - 写入默认 `page` / `limit`（与全局 {@link DEFAULT_TABLE_PAGE_SIZE} 一致）
 * - 提供与分页联动的 **`onSearch` / `onReset`**
 * - 可选 **`routeQuery`**：在首次拉取前同步/异步解析 URL 查询参数，避免与 `immediate` 竞态； reset 时恢复到 `listFilters` 基线，并自动从
 *   URL 移除 deep-link 参数（`resolve` 专用 key 需声明 `extraQueryKeys`）
 */
export interface UseAdminListTableOptions<A extends NaiveUI.TableApiFn> {
  apiFn: A;
  /** 除分页外的初始查询字段，需与接口入参键名一致；亦为 reset 基线 */
  listFilters?: ListFilters<A>;
  immediate?: boolean;
  showTotal?: boolean;
  routeQuery?: RouteQueryConfig<ListFilters<A>>;
}

export function useAdminListTable<A extends NaiveUI.TableApiFn>(
  options: UseAdminListTableOptions<A>
) {
  const { apiFn, listFilters, showTotal, routeQuery } = options;
  const route = useRoute();
  const router = useRouter();

  const baselineFilters = { ...(listFilters as object) } as ListFilters<A>;

  const usesRouteQuery = Boolean(routeQuery);
  const immediate = options.immediate ?? !usesRouteQuery;

  const tableState = useTable<A>({
    apiFn,
    apiParams: {
      page: 1,
      limit: DEFAULT_TABLE_PAGE_SIZE,
      ...baselineFilters
    } as ListParams<A>,
    columns: () => tableListPlaceholderColumns<A>(),
    immediate: usesRouteQuery ? false : immediate,
    showTotal
  });

  if (routeQuery?.mapping) {
    applyRouteQueryToModel(
      route.query,
      tableState.searchParams as ListFilters<A>,
      routeQuery.mapping
    );
  }

  const getListLimit = () =>
    (tableState.pagination.pageSize as number | undefined) ?? DEFAULT_TABLE_PAGE_SIZE;

  function onSearch() {
    tableState.updateSearchParams({
      page: 1,
      limit: getListLimit()
    } as Partial<ListParams<A>>);
    tableState.getData();
  }

  function onReset() {
    tableState.resetSearchParams();

    if (routeQuery) {
      const keys = collectRouteQueryKeys(routeQuery);
      if (keys.some(key => readRouteQueryValue(route.query[key]) !== undefined)) {
        router.replace({ query: clearRouteQuery(route.query, keys) });
      }
    }

    tableState.getData();
  }

  async function bootstrapFromRoute() {
    if (!routeQuery) {
      return;
    }

    await applyRouteQueryFilters(
      route.query,
      tableState.searchParams as ListFilters<A>,
      routeQuery
    );
    await tableState.getData();
  }

  if (routeQuery) {
    onMounted(() => {
      bootstrapFromRoute();
    });
    useRouteQueryWatcher(tableState.searchParams as ListFilters<A>, routeQuery, onSearch);
  }

  return {
    ...tableState,
    onSearch,
    onReset,
    getListLimit
  };
}
