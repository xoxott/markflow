import type { VNode } from 'vue';
import AdminRemoteSelectImpl from './AdminRemoteSelect';
import type { AdminRemoteSelectProps } from './types';

/** resource 为字面量时 query 随 resource 类型收窄 */
export const AdminRemoteSelect = AdminRemoteSelectImpl as unknown as (
  props: AdminRemoteSelectProps
) => VNode;

export type { AdminRemoteSelectProps, AdminRemoteSelectQuery } from './types';
