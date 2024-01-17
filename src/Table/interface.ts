import type { PaginationProps } from 'antd'
import type { features } from 'o-rc-table'
import React from 'react'

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

export interface TableFeaturesType {
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
}
