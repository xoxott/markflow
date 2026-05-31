import { type PropType, type VNodeChild, computed, defineComponent } from 'vue';
import { NDataTable } from 'naive-ui';
import type {
  DataTableColumns,
  DataTableProps as NaiveDataTableProps,
  PaginationProps
} from 'naive-ui';
import { $t } from '@/locales';
import type { DataTableProps, PresetRendererType, TableColumnConfig } from './types';
import { useDataTableHeight } from './hooks/useDataTableHeight';
import {
  ActionRenderer,
  AvatarRenderer,
  BadgeRenderer,
  DateRenderer,
  StatusRenderer,
  TagRenderer,
  TextRenderer
} from './renderers';

type TableRow = Record<string, unknown>;

/**
 * 在 naive NDataTable 之上封装：
 *
 * - 可选多选列、序号列；
 * - 列配置支持字符串预设渲染器（avatar / status / date 等）或自定义 render 函数；
 * - `tableProps` 向底层表格透传，便于开启 remote、虚拟滚动等高级特性。
 */
export default defineComponent({
  name: 'DataTable',
  props: {
    columns: {
      type: Array as PropType<TableColumnConfig<TableRow>[]>,
      required: true
    },
    data: {
      type: Array as PropType<TableRow[]>,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    pagination: {
      type: Object as PropType<NaiveDataTableProps['pagination']>,
      default: undefined
    },
    selectedKeys: {
      type: Array as PropType<(string | number)[]>,
      default: () => []
    },
    rowKey: {
      type: [String, Function] as PropType<DataTableProps<TableRow>['rowKey']>,
      default: 'id'
    },
    onUpdateSelectedKeys: {
      type: Function as PropType<(keys: (string | number)[]) => void>,
      default: undefined
    },
    scrollX: {
      type: Number,
      default: undefined
    },
    showIndex: {
      type: Boolean,
      default: true
    },
    showSelection: {
      type: Boolean,
      default: true
    },
    striped: {
      type: Boolean,
      default: true
    },
    size: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small'
    },
    bordered: {
      type: Boolean,
      default: false
    },
    maxHeight: {
      type: [String, Number] as PropType<string | number>,
      default: undefined
    },
    autoHeight: {
      type: Boolean,
      default: true
    },
    tableProps: {
      type: Object as PropType<Partial<NaiveDataTableProps>>,
      default: undefined
    }
  },
  setup(props) {
    const hasExplicitMaxHeight = computed(() => props.maxHeight !== undefined);
    const hasExplicitFlexHeight = computed(
      () => props.tableProps !== undefined && 'flexHeight' in props.tableProps
    );

    const autoFlexEnabled = computed(
      () => props.autoHeight && !hasExplicitMaxHeight.value && !hasExplicitFlexHeight.value
    );

    const selectionEnabled = computed(
      () => props.showSelection && typeof props.onUpdateSelectedKeys === 'function'
    );

    const { containerRef, flexHeight } = useDataTableHeight(autoFlexEnabled);

    const naiveRowKey = computed((): ((row: TableRow) => string | number) => {
      const rk = props.rowKey;
      if (typeof rk === 'function') {
        return rk;
      }
      const field = typeof rk === 'string' && rk.length > 0 ? rk : 'id';
      return row => row[field] as string | number;
    });

    const processedColumns = computed((): DataTableColumns<TableRow> => {
      const cols: DataTableColumns<TableRow> = [];

      if (selectionEnabled.value) {
        cols.push({
          type: 'selection',
          width: 40,
          fixed: 'left'
        });
      }

      if (props.showIndex) {
        cols.push({
          title: $t('common.index'),
          key: 'index',
          width: 70,
          fixed: 'left',
          align: 'center',
          render: (_row, index) => {
            const pg = props.pagination;
            const isObj = typeof pg === 'object' && pg !== null;
            const page = isObj ? Number((pg as PaginationProps).page ?? 1) || 1 : 1;
            const pageSize = isObj ? Number((pg as PaginationProps).pageSize ?? 10) || 10 : 10;
            return (page - 1) * pageSize + index + 1;
          }
        });
      }

      props.columns.forEach(column => {
        const { render, renderConfig, ...restColumn } = column;
        const key = String(column.key);

        if (typeof render === 'function') {
          cols.push({
            ...restColumn,
            key,
            render
          });
          return;
        }

        if (typeof render === 'string') {
          const rendererType = render as PresetRendererType;

          cols.push({
            ...restColumn,
            key,
            render: (row: TableRow) => {
              switch (rendererType) {
                case 'avatar':
                  return <AvatarRenderer row={row} config={renderConfig as never} />;
                case 'status':
                  return <StatusRenderer row={row} field={key} config={renderConfig as never} />;
                case 'date':
                  return <DateRenderer row={row} field={key} config={renderConfig as never} />;
                case 'tag':
                  return <TagRenderer row={row} field={key} config={renderConfig as never} />;
                case 'badge':
                  return <BadgeRenderer row={row} field={key} config={renderConfig as never} />;
                case 'action':
                  return <ActionRenderer row={row} config={renderConfig as never} />;
                case 'text':
                  return <TextRenderer row={row} field={key} config={renderConfig as never} />;
                default:
                  return row[key] as VNodeChild;
              }
            }
          });
          return;
        }

        cols.push({
          ...restColumn,
          key,
          render: (row: TableRow) => {
            const value = row[key];
            return (value !== null && value !== undefined ? value : '-') as VNodeChild;
          }
        });
      });

      return cols;
    });

    const usesServerPagination = computed(() => {
      const pg = props.pagination;
      return pg !== false && pg !== undefined && typeof pg === 'object';
    });

    const mergedTableProps = computed((): Partial<NaiveDataTableProps> => {
      const useFlexHeight = autoFlexEnabled.value && flexHeight.value;

      return {
        ...(props.tableProps ?? {}),
        remote: props.tableProps?.remote ?? (usesServerPagination.value ? true : undefined),
        columns: processedColumns.value,
        data: props.data,
        loading: props.loading,
        pagination: props.pagination,
        rowKey: naiveRowKey.value,
        scrollX: props.scrollX,
        striped: props.striped,
        size: props.size,
        bordered: props.bordered,
        ...(useFlexHeight
          ? { flexHeight: true }
          : hasExplicitMaxHeight.value
            ? { maxHeight: props.maxHeight }
            : {}),
        ...(selectionEnabled.value
          ? {
              checkedRowKeys: props.selectedKeys,
              onUpdateCheckedRowKeys: props.onUpdateSelectedKeys
            }
          : {})
      };
    });

    return () => (
      <div
        ref={containerRef}
        class="h-full min-h-0 flex flex-col [&_.n-data-table_.n-badge-sup]:z-0 [&_.n-data-table\_\_pagination]:box-border [&_.n-data-table]:h-full [&_.n-data-table\_\_pagination]:px-16px [&_.n-data-table\_\_pagination]:pb-16px [&_.n-data-table\_\_pagination]:pt-8px"
      >
        <NDataTable {...mergedTableProps.value} />
      </div>
    );
  }
});
