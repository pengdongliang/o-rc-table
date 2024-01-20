import type { ModalCallbackParamsType, TableRef } from '@ocloud/antd'
import { useCallback } from 'react'

export interface PageRefreshProps {
  /** Table表格Ref */
  tableRef?: TableRef | any
}

/**
 * 刷新钩子(一般用与表格刷新)
 */
export const usePageRefresh = (props: PageRefreshProps) => {
  const { tableRef } = props

  /**
   * 刷新表格, refreshType默认0
   */
  const refreshTable = useCallback(
    (args?: ModalCallbackParamsType) => {
      const { refreshType = 0 } = args ?? {}
      if (refreshType === 1) {
        tableRef?.current?.refresh()
      } else {
        tableRef?.current?.search?.submit()
      }
    },
    [tableRef]
  )
  return { refreshTable }
}
