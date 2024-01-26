import { useTheme } from '@emotion/react'
import { useDomRect } from '@ocloud/admin-hooks'
import React, { useEffect, useMemo, useState } from 'react'

export interface TableLayoutHeightProps {
  /** 表格ref */
  tableBoxRef?: React.RefObject<HTMLElement>
  /** 是否分页 */
  pagination?: boolean
}

/**
 * 表格高度hooks
 */
export const useTableLayoutHeight = (props: TableLayoutHeightProps) => {
  const { tableBoxRef, pagination } = props
  const [remainingHeight, setRemainingHeight] = useState<number>(0)
  const theme = useTheme()

  const headerRect = useDomRect(
    () => tableBoxRef?.current?.firstElementChild?.getElementsByClassName(`${theme?.namespace}-table-thead`)?.[0]
  )

  const paginationRect = useDomRect(
    () => tableBoxRef?.current?.firstElementChild?.getElementsByClassName(`${theme?.namespace}-table-pagination`)?.[0]
  )
  const advancedQueriesSize = useDomRect(() => document.querySelector('.advancedQueries_box'))

  useEffect(() => {
    const { flexHeight = 0 } = headerRect
    setRemainingHeight(flexHeight + (advancedQueriesSize?.height ?? 0))
  }, [headerRect, advancedQueriesSize])

  const tableHeight = useMemo(() => {
    const { height = 0 } = headerRect
    const paginationHeight = pagination ? (paginationRect?.height ?? 24) + 8 : 0
    return Math.round(remainingHeight - height - paginationHeight - 10 - 8 - 11)
  }, [headerRect, pagination, paginationRect?.height, remainingHeight])

  return [tableHeight]
}
