import type { PaginationProps } from 'antd'
import type { features } from 'o-rc-table'

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
  /** 自动高度 */
  autoHeight?: boolean
}
