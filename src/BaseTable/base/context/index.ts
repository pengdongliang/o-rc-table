import React from 'react'

import { GetComponent } from '../interfaces'
import { getTableClasses } from '../styles'
import { getValue } from '../utils'

export interface BaseTableContextProps {
  /** 前缀 */
  namespace: string
  /** class name */
  Classes: ReturnType<typeof getTableClasses> | Record<string, any>
  getComponent?: GetComponent
}

export const defaultTableComponents = {
  EmptyContent: undefined,
  table: 'table',
  header: {
    wrapper: 'thead',
    row: 'tr',
    cell: 'th',
  },
  body: {
    wrapper: 'tbody',
    row: 'tr',
    cell: 'td',
  },
}

export const BaseTableContext = React.createContext<BaseTableContextProps>({
  namespace: '',
  Classes: {},
  getComponent: (path, defaultComponent) => getValue(defaultTableComponents, path) || defaultComponent,
})

export const useBaseTableContext = () => {
  return React.useContext(BaseTableContext)
}
