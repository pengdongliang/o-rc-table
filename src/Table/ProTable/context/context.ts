import type { FormRef } from '@ocloud/antd'
import React, { useContext } from 'react'

import type { TableProps } from '../table'

/**
 * 表格上下文类型
 */
export interface TableContextType {
  /** 搜索栏Form Ref */
  searchFormRef?: React.Ref<FormRef>
  /** 表格行key */
  rowKey?: TableProps['rowKey']
  /** 编辑行Key */
  editingRowKey?: string
  /** 设置编辑行Key */
  setEditingRowKey?: (key: string) => void
}

export const TableContext = React.createContext<TableContextType>(null)

export const useTable = () => useContext(TableContext)
