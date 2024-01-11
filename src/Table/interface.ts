import { InternalTableProps, TableProps, TableRef } from '@table/InternalTable'
import * as React from 'react'

import { AnyObject } from '../theme/interface'

export type RefTable = <RecordType extends AnyObject = AnyObject>(
  props: React.PropsWithChildren<TableProps<RecordType>>
) => React.ReactElement

export type RefInternalTable = <RecordType extends AnyObject = AnyObject>(
  props: React.PropsWithChildren<InternalTableProps<RecordType>> & React.Ref<TableRef>
) => React.ReactElement
