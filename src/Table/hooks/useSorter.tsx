import type { ColumnType, SortOrder } from 'o-rc-table'
import { Key } from 'react'

export interface SortState<RecordType> {
  column: ColumnType<RecordType>
  key: Key
  sortOrder: SortOrder | null
  multiplePriority: number | false
}
