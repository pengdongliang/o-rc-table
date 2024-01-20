import React from 'react'

import type { TableContextType } from './context'
import { TableContext } from './context'

export interface TableProviderProps extends TableContextType {
  /** children */
  children?: React.ReactNode
  /** value */
  value?: TableContextType
}

/**
 * 表格上下文提供者
 */
export const TableProvider = (props: TableProviderProps) => {
  const { children, value } = props

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>
}
