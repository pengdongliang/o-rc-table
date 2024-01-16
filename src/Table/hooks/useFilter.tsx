import type { ColumnType } from 'o-rc-table'
import { Key } from 'react'

export type FilterKey = (string | number)[] | null

export interface FilterState<RecordType> {
  column: ColumnType<RecordType>
  key: Key
  filteredKeys?: FilterKey
  forceFiltered?: boolean
}
