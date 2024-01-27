import { useConfigContext, useLocale, useRequest } from '@ocloud/admin-context'
import type { FormRef } from '@ocloud/antd'
import type { AnyObject } from '@src/theme/interface'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { BehaviorSubject } from 'rxjs'

import { handleDefaultTableConfig } from '../helpers/handleDefaultTableConfig'
import { handlePaginationConfig } from '../helpers/handlePaginationConfig'
import { handleTableParamsData } from '../helpers/handleTableParamsData'
import type { TableProps, UseAntdRowItemType, UseAntdTablePaginationType } from '../table'

/**
 * 表格请求接口方法类型
 */
export type TableRequestParamsType = (
  /** 分页数据 */
  pagination: UseAntdTablePaginationType,
  /** 表单数据 */
  formData: Record<string, any>
) => Promise<UseAntdRowItemType>

export interface SubjectInfoType {
  tableDataPromise?: TableRequestParamsType | (() => null)
  queryParams?: Record<string, any>
  urlSearchParams?: string
}

export interface RootSubjectType<RecordType> extends Partial<TableProps<RecordType>> {
  subjectInfo?: SubjectInfoType
}

export const useRootSubject = <RecordType extends AnyObject = AnyObject>(
  props: RootSubjectType<RecordType>,
  searchFormRef: React.MutableRefObject<FormRef>
) => {
  const rootSubject = useRef<BehaviorSubject<RootSubjectType<RecordType>>>(null)
  const [tableProps, setTableProps] = useState<RootSubjectType<RecordType>>(props)
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])
  const [editingRowKey, setEditingRowKey] = useState<string>('')

  const { formatMessage } = useLocale()
  const { tableConfig: tableConfigContext } = useConfigContext()
  const { request } = useRequest()

  const didMountOrUpdate = useCallback(() => {
    rootSubject.current
      .pipe(
        (source$) => handleDefaultTableConfig({ source$, expandedRowKeys, setExpandedRowKeys }),
        (source$) => handlePaginationConfig(source$, formatMessage),
        (source$) =>
          handleTableParamsData<RecordType>({
            source$,
            tableConfigContext,
            request,
            searchFormRef,
            editingRowKey,
            setEditingRowKey,
          })
      )
      .subscribe((v) => {
        setTableProps(v)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedRowKeys, formatMessage, tableConfigContext])

  useEffect(() => {
    if (rootSubject.current && !rootSubject.current.closed) {
      rootSubject.current.next(props)
      didMountOrUpdate()
    }
  }, [didMountOrUpdate, props])

  useEffect(() => {
    rootSubject.current = new BehaviorSubject(props)

    return () => {
      if (!rootSubject.current.closed) {
        rootSubject.current.unsubscribe()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return tableProps
}
