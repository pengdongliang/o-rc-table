import React, { ReactNode } from 'react'

export type ArtColumnAlign = 'left' | 'center' | 'right'

export type ArtColumnVerticalAlign = 'top' | 'bottom' | 'middle'

export type HeaderCellProps = (col: ColumnType) => React.HTMLAttributes<any> & React.TdHTMLAttributes<any>

export type CellProps = React.TdHTMLAttributes<HTMLTableCellElement>

export type CellEllipsisType = { showTitle?: boolean } | boolean

export interface ArtColumnStaticPart {
  /** 列的名称 */
  name?: string

  /** 列的唯一标识 */
  key?: string

  /** 在数据中的字段 dataIndex */
  dataIndex?: string

  /** 列标题的展示名称；在页面中进行展示时，该字段将覆盖 name 字段 */
  title?: ReactNode[] | ReactNode

  /** 列的宽度，如果该列是锁定的，则宽度为必传项 */
  width?: number | string

  /** 单元格中的文本或内容的 对其方向 */
  align?: ArtColumnAlign

  /** 单元格中的文本或内容的 垂直水平轴对其方向 */
  verticalAlign?: ArtColumnVerticalAlign

  /** @deprecated 是否隐藏 */
  hidden?: boolean

  /** 是否锁列 */
  fixed?: boolean

  /** 是否允许拖拽 */
  // dragable?: boolean

  /** 表头单元格的 props */
  onHeaderCell?: HeaderCellProps

  /** 单元格自动省略 */
  ellipsis?: CellEllipsisType

  /** 功能开关 */
  features?: { [key: string]: any }

  /** 表头设置操作项到自定义操作区 */
  renderHeader?: (title: ReactNode, opr: ReactNode) => ReactNode

  /** 列样式类名 */
  className?: string

  /** 表头列合并 */
  colSpan?: number
}

export interface Features {
  /** 是否开启排序功能 */
  sortable?: boolean

  /** 是否开启过滤功能 */
  filterable?: boolean
}

export interface ArtColumnDynamicPart<RecordType = unknown> {
  /** 自定义取数方法 */
  getValue?(row: RecordType, rowIndex: number): any

  /** 自定义渲染方法 */
  render?(value: any, row: RecordType, rowIndex: number): ReactNode

  /** 自定义的获取单元格 props 的方法 */
  onCell?(value: any, row: RecordType, rowIndex: number): CellProps

  /** 自定义的获取单元格 SpanRect 方法 */
  getSpanRect?(value: any, row: RecordType, rowIndex: number): SpanRect
}

export interface ColumnType<RecordType = unknown> extends ArtColumnStaticPart, ArtColumnDynamicPart<RecordType> {
  /** 该列的子节点 */
  children?: ColumnType<RecordType>[]
}

/** SpanRect 用于描述合并单元格的边界
 * 注意 top/left 为 inclusive，而 bottom/right 为 exclusive */
export interface SpanRect {
  top: number
  bottom: number
  left: number
  right: number
}

export interface AbstractTreeNode {
  children?: AbstractTreeNode[]
}

export type SortOrder = 'desc' | 'asc' | 'none'

export type SortItem = { dataIndex: string; order: SortOrder }

export interface FilterItem {
  filter: any[]
  dataIndex?: string
  filterCondition?: string
}
export type Filters = FilterItem[]

export type Transform<T> = (input: T) => T

export type TableTransform = Transform<{
  columns: ColumnType[]
  dataSource: any[]
}>

export interface HoverRange {
  start: number
  end: number
}

export interface ColumnResizeItem {
  width: number
  index: number
}

export interface FilterPanelProps {
  isFilterActive: boolean
  hidePanel(): void
}

export interface DefaultFilterPanelProps extends FilterPanelProps {
  setFilterModel(filterItem?: Pick<FilterItem, 'filter' | 'filterCondition'>): void
  filterModel: FilterItem
  localeText: { [key: string]: string }
}

export interface CustomeFilterPanelProps extends FilterPanelProps {
  setFilter(filter?: any[]): void
  filterModel: FilterItem
}

export type FilterPanel = React.ComponentType<DefaultFilterPanelProps | CustomeFilterPanelProps>
