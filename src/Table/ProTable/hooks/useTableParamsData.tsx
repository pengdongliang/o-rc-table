import { useConfigContext, useRequest } from '@ocloud/admin-context'
import { filterRequestParams, lowerLineToSmallHump, smallHumpToLowerLine } from '@ocloud/admin-utils'
import { useAntdTable } from 'ahooks'
import { useState } from 'react'

import { defaultTableRequestFields } from '../config'
import type { TableProps, UseAntdRowItemType } from '../table'
import { UseAntdTablePaginationType } from '../table'

/**
 * 表格请求接口方法类型
 */
export type TableRequestParamsType = (
  /** 分页数据 */
  pagination: UseAntdTablePaginationType,
  /** 表单数据 */
  formData: Record<string, any>
) => Promise<UseAntdRowItemType>

/**
 * 数据钩子返回的类型
 */
export interface UseTableParamsDataResultType extends ReturnType<typeof useAntdTable> {
  /** 请求的所有参数对象 */
  queryParams: Record<string, any>
  /** 请求的所有url参数 */
  urlSearchParams: string
}

/**
 * table表格请求方式的数据
 * @param props
 */
export const useTableParamsData = (props: TableProps): UseTableParamsDataResultType => {
  const {
    request: propsRequest,
    useAntdTableOptions,
    initParams,
    tableRequestFields: propsTableRequestFields,
    requestParamsHandler,
    requestOptions,
    filterRequestValue = true,
    responseDataHandler,
  } = props
  let getTableDataPromise: TableRequestParamsType | null = null
  const { tableConfig } = useConfigContext()
  const {
    current: currentFieldName = '',
    pageSize: pageSizeFieldName = '',
    total: totalFieldName = '',
    records: recordsFieldName = '',
    data: dataFieldName = '',
  } = {
    ...defaultTableRequestFields,
    ...tableConfig?.tableRequestFields,
    ...propsTableRequestFields,
  }
  const { request } = useRequest()
  const [queryParams, setQueryParams] = useState({})
  const [urlSearchParams, setUrlSearchParams] = useState<string>('')

  if (propsRequest) {
    getTableDataPromise = async (
      searchParams: UseAntdTablePaginationType,
      formData: Record<string, any>
    ): Promise<UseAntdRowItemType> => {
      let extraParams = {}
      const { order, field, column } = searchParams?.sorter ?? {}

      if (order && field) {
        const { sortConfig, sortDirections } = column ?? {}
        const { sortFieldsName = [], orderFieldName } = sortConfig ?? {}
        let sortType = order
        if (!Array.isArray(sortDirections) || !sortDirections.length) {
          sortType = order === 'ascend' ? 'asc' : 'desc'
        }
        let fieldName = field
        try {
          if (orderFieldName) {
            if (typeof orderFieldName === 'function') {
              fieldName = orderFieldName(field)
            } else {
              fieldName = orderFieldName === 'lowerLine' ? smallHumpToLowerLine(field) : lowerLineToSmallHump(field)
            }
          }
        } catch (err) {
          fieldName = field
          throw new Error(err as string)
        }
        extraParams = {
          [sortFieldsName[0] ?? 'order']: sortType,
          [sortFieldsName[1] ?? 'orderField']: fieldName,
        }
      }

      const { searchParams: realSearchParams, formData: realFormData } =
        typeof requestParamsHandler === 'function'
          ? requestParamsHandler(searchParams, formData, extraParams)
          : { searchParams, formData }
      const { current, pageSize } = realSearchParams ?? {}

      const paramsData = {
        [currentFieldName]: current,
        [pageSizeFieldName]: pageSize,
        ...initParams,
        ...extraParams,
        ...realFormData,
      }

      const newParamsData = filterRequestParams(paramsData, filterRequestValue)
      setQueryParams(newParamsData)
      setUrlSearchParams(new URLSearchParams(newParamsData).toString())

      const {
        method = 'get',
        params,
        body,
      } = typeof requestOptions === 'function'
        ? requestOptions({ params: newParamsData })
        : { params: newParamsData, body: undefined }

      try {
        const res = await (typeof propsRequest === 'function' ? propsRequest : request)({
          url: typeof propsRequest === 'string' ? propsRequest : undefined,
          method,
          params,
          body,
          filterRequestValue,
        })
        let data = (dataFieldName ? res[dataFieldName] : res) ?? {}
        if (typeof responseDataHandler === 'function') {
          data = responseDataHandler(data, res)
        }
        return {
          total: data[totalFieldName],
          list: data[recordsFieldName],
        }
      } catch (err) {
        console.error('request table data error: ', err)
        return {
          total: 0,
          list: [],
        }
      }
    }
  }

  const tableParamsData = useAntdTable(getTableDataPromise as TableRequestParamsType, {
    ...useAntdTableOptions,
  })

  return { ...tableParamsData, queryParams, urlSearchParams }
}
