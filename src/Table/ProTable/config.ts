import type { TableConfigType } from '@ocloud/admin-context'

import type { TableProps } from './index'

/**
 * 分页类型
 */
export type PaginationConfigType = TableProps['pagination']

/**
 * 默认分页配置
 */
export const defaultPaginationConfig: PaginationConfigType = {
  current: 1,
  pageSize: 20,
  total: 0,
  pageSizeOptions: [10, 20, 50, 100, 200, 500],
}

/**
 * 默认antd表格配置
 */
export const defaultTableConfig: Partial<TableProps> = {
  rowKey: 'id',
  tableLayout: 'fixed',
  bordered: true,
}

/**
 * 默认表格请求字段
 */
export const defaultTableRequestFields: Readonly<TableConfigType> = {
  current: 'page',
  pageSize: 'limit',
  total: 'total',
  records: 'list',
  data: 'data',
}
