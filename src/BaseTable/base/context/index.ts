import React from 'react'

import { getTableClasses } from '../styles'

export interface BaseTableContextProps {
  /** 前缀 */
  namespace: string
  /** class name */
  Classes: ReturnType<typeof getTableClasses> | Record<string, any>
}

export const BaseTableContext = React.createContext<BaseTableContextProps>({
  namespace: '',
  Classes: {},
})

export const useBaseTableContext = () => {
  return React.useContext(BaseTableContext)
}
