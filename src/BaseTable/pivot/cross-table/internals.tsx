import { ColumnType } from '../../interfaces'

export interface CrossTableLeftColumn extends ColumnType {
  columnType: 'left'
  children?: never
}

export interface CrossTableDataColumn extends ColumnType {
  columnType: 'data'
}

export interface CrossTableDataParentColumn extends ColumnType {
  columnType: 'data-parent'
  children: (CrossTableDataParentColumn | CrossTableDataColumn)[]
}

export type CrossTableRenderColumn = CrossTableLeftColumn | CrossTableDataColumn | CrossTableDataParentColumn
