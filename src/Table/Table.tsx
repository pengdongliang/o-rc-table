import type { AnyObject } from '@src/theme/interface'
import * as React from 'react'

import type { RefTable } from './interface'
import type { TableProps } from './InternalTable'
import InternalTable from './InternalTable'

const Table = <RecordType extends AnyObject = AnyObject>(props: TableProps<RecordType>) => {
  const renderTimesRef = React.useRef<number>(0)
  renderTimesRef.current += 1
  return <InternalTable<RecordType> {...props} _renderTimes={renderTimesRef.current} />
}

const ForwardTable = React.forwardRef(Table) as unknown as RefTable & {
  displayName?: string
}

if (process.env.NODE_ENV !== 'production') {
  ForwardTable.displayName = 'Table'
}

export default ForwardTable
