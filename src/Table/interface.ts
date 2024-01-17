import type { CheckboxProps, PaginationProps } from 'antd'
import type { features } from 'o-rc-table'
import React, { Key } from 'react'

export interface TableLocale {
  filterTitle?: string
  filterConfirm?: React.ReactNode
  filterReset?: React.ReactNode
  filterEmptyText?: React.ReactNode
  filterCheckall?: React.ReactNode
  filterSearchPlaceholder?: string
  emptyText?: React.ReactNode | (() => React.ReactNode)
  selectAll?: React.ReactNode
  selectNone?: React.ReactNode
  selectInvert?: React.ReactNode
  selectionAll?: React.ReactNode
  sortTitle?: string
  expand?: string
  collapse?: string
  triggerDesc?: string
  triggerAsc?: string
  cancelSort?: string
}

type TablePaginationPosition =
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight'
  | 'none'

export interface TablePaginationConfig extends PaginationProps {
  position?: TablePaginationPosition[]
}

export type RowSelectionType = 'checkbox' | 'radio'
export type RowSelectMethod = 'check' | 'uncheck' | 'check-all' | 'uncheck-all'
export type FixedType = boolean
export type GetComponentProps<DataType> = (
  data: DataType,
  index?: number
) => React.HTMLAttributes<any> & React.TdHTMLAttributes<any>
export type SelectionSelectFn<T> = (record: T, selected: boolean, selectedRows: T[], nativeEvent: Event) => void

export interface TableRowSelection<T = any> {
  /** Keep the selection keys in list even the key not exist in `dataSource` anymore */
  preserveSelectedRowKeys?: boolean
  type?: RowSelectionType
  selectedRowKeys?: Key[]
  defaultSelectedRowKeys?: Key[]
  onChange?: (selectedRowKeys: Key[], selectedRows: T[], info: { type: RowSelectMethod }) => void
  getCheckboxProps?: (record: T) => Partial<Omit<CheckboxProps, 'checked' | 'defaultChecked'>>
  onSelect?: SelectionSelectFn<T>
  // selections?: INTERNAL_SELECTION_ITEM[] | boolean
  hideSelectAll?: boolean
  fixed?: FixedType
  columnWidth?: string | number
  columnTitle?: React.ReactNode | ((checkboxNode: React.ReactNode) => React.ReactNode)
  checkStrictly?: boolean
  renderCell?: (value: boolean, record: T, index: number, originNode: React.ReactNode) => React.ReactNode
  onCell?: GetComponentProps<T>
}

export interface TableFeaturesType<RecordType = any> {
  /** 拖拽列宽 */
  dragColumnWidth?: boolean | features.ColumnResizeOptions
  /** 行高自适应 */
  autoRowHeight?: boolean | React.StyleHTMLAttributes<HTMLDivElement>
  /** 自动合并多行 */
  autoRowSpan?: boolean
  /** 拖拽列位置 */
  columnDrag?: boolean | features.ColumnDragOptions
  /** 列分组展开收起 */
  columnGroupExpand?: boolean | features.ColGroupExtendOption
  /** 列高亮 */
  columnHighlight?: boolean | features.ColumnRangeHoverFeatureOptions
  /** 排序 */
  sort?: boolean | features.SortFeatureOptions
  /** 过滤 */
  filter?: boolean | features.FilterFeatureOptions
  /** 行选择 */
  rowSelection?: TableRowSelection<RecordType>
}
