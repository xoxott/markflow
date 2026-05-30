import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { DEFAULT_TABLE_PAGE_SIZE } from '@/constants/datatable';
import { useTable } from '@/hooks/common/table';
import {
  type RouteQueryConfig,
  applyRouteQueryFilters,
  applyRouteQueryToModel,
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
 * - 可选 **`routeQuery`**：在首次拉取前同步/异步解析 URL 查询参数，避免与 `immediate` 竞态
 */
export interface UseAdminListTableOptions<A extends NaiveUI.TableApiFn> {
  apiFn: A;
  /** 除分页外的初始查询字段，需与接口入参键名一致 */
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

  const initialFilters = { ...(listFilters as object) } as ListFilters<A>;

  if (routeQuery?.mapping) {
    applyRouteQueryToModel(route.query, initialFilters, routeQuery.mapping);
  }

  const usesRouteQuery = Boolean(routeQuery);
  const immediate = options.immediate ?? !usesRouteQuery;

  const tableState = useTable<A>({
    apiFn,
    apiParams: {
      page: 1,
      limit: DEFAULT_TABLE_PAGE_SIZE,
      ...initialFilters
    } as ListParams<A>,
    columns: () => tableListPlaceholderColumns<A>(),
    immediate: usesRouteQuery ? false : immediate,
    showTotal
  });

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

  if (usesRouteQuery) {
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
