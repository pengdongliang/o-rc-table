import React, { useRef } from 'react'

import { useTableLayoutHeight } from './hooks/useTableLayoutHeight'
import { StyledTableLayout } from './styled'

export interface TableLayoutProps {
  /** children */
  children: React.ReactNode
  /** 是否分页 */
  pagination?: boolean
}

/**
 * 表格布局容器
 */
export const TableLayout = (props: TableLayoutProps) => {
  const { children, pagination } = props
  const tableBoxRef = useRef<HTMLDivElement>(null)

  const [tableHeight] = useTableLayoutHeight({ tableBoxRef, pagination })

  return (
    <StyledTableLayout
      className="table_layout"
      tableHeight={tableHeight < 0 ? undefined : tableHeight}
      ref={tableBoxRef}
    >
      {children}
    </StyledTableLayout>
  )
}
