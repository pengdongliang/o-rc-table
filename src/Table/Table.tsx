import type { AnyObject } from '@src/theme/interface'
import * as React from 'react'

import type { TableProps, TableRef } from './InternalTable'
import InternalTable from './InternalTable'

const Table = <RecordType extends AnyObject = AnyObject>(props: TableProps<RecordType>, ref: React.Ref<TableRef>) => {
  const renderTimesRef = React.useRef<number>(0)
  renderTimesRef.current += 1
  return <InternalTable<RecordType> {...props} ref={ref} _renderTimes={renderTimesRef.current} />
}

const ForwardTable = React.forwardRef(Table) as unknown as (<RecordType extends AnyObject = AnyObject>(
  props: React.PropsWithChildren<TableProps<RecordType>> & {
    ref?: React.Ref<TableRef>
  }
) => React.ReactElement) & {
  displayName?: string
}

if (process.env.NODE_ENV !== 'production') {
  ForwardTable.displayName = 'Table'
}

export default React.memo(ForwardTable)
