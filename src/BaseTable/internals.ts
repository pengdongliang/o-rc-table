import type { BaseTableProps } from './base/table'
import type { ColumnType } from './interfaces'

function safeRenderHeader(column: ColumnType) {
  return column.title ?? column.name
}

function safeGetValue(column: ColumnType, record: any, rowIndex: number) {
  if (column.getValue) {
    return column.getValue(record, rowIndex)
  }
  return record[column.dataIndex]
}

function safeGetRowKey(rowKey: BaseTableProps['rowKey'], record: any, rowIndex: number | string): string {
  let key: string
  if (typeof rowKey === 'string') {
    key = record[rowKey]
  } else if (typeof rowKey === 'function') {
    key = rowKey(record) as string
  }
  if (key == null) {
    key = String(rowIndex)
  }
  return key
}

function safeGetCellProps(column: ColumnType, record: any, rowIndex: number) {
  if (column.getCellProps) {
    const value = safeGetValue(column, record, rowIndex)
    return column.getCellProps(value, record, rowIndex) || {}
  }
  return {}
}

function safeRender(column: ColumnType, record: any, rowIndex: number) {
  const value = safeGetValue(column, record, rowIndex)
  if (column.render) {
    return column.render(value, record, rowIndex)
  }
  return value
}

export const internals = {
  safeRenderHeader,
  safeGetValue,
  safeGetRowKey,
  safeGetCellProps,
  safeRender,
} as const
