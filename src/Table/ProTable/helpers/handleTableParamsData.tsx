import { type ConfigProviderProps } from '@ocloud/admin-context'
import { filterRequestParams, lowerLineToSmallHump, smallHumpToLowerLine } from '@ocloud/admin-utils'
import type { FormRef } from '@ocloud/antd'
import { defaultTableRequestFields, EditableConfigType } from '@table/ProTable'
import { useAntdTable } from 'ahooks'
import type { Params as AntdTableParams } from 'ahooks/es/useAntdTable/types'
import { Observable } from 'rxjs'
import * as op from 'rxjs/operators'

import type { RootSubjectType } from '../hooks/useRootSubject'
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

export interface HandleTableParamsDataProps<RecordType> {
  source$: Observable<RootSubjectType<RecordType>>
  tableConfigContext: ConfigProviderProps['tableConfig']
  request: Exclude<TableProps['request'], string>
  searchFormRef: React.MutableRefObject<FormRef>
  editingRowKey: string
  setEditingRowKey: React.Dispatch<React.SetStateAction<string>>
}

/**
 * table表格请求方式的数据
 * @param props
 */
export const handleTableParamsData = <TData,>({
  source$,
  tableConfigContext,
  request,
  searchFormRef,
  editingRowKey,
  setEditingRowKey,
}: HandleTableParamsDataProps<TData>) => {
  let queryParams: Record<string, any> = {}
  let urlSearchParams = ''
  const getTableDataPromise = (props: RootSubjectType<TData>) => {
    const {
      request: propsRequest,
      initParams,
      tableRequestFields: propsTableRequestFields,
      requestParamsHandler,
      requestOptions,
      filterRequestValue = true,
      responseDataHandler,
    } = props

    const {
      current: currentFieldName = '',
      pageSize: pageSizeFieldName = '',
      total: totalFieldName = '',
      records: recordsFieldName = '',
      data: dataFieldName = '',
    } = {
      ...defaultTableRequestFields,
      ...tableConfigContext?.tableRequestFields,
      ...propsTableRequestFields,
    }

    if (propsRequest) {
      return async (
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
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          [pageSizeFieldName]: pageSize,
          ...initParams,
          ...extraParams,
          ...realFormData,
        }

        const newParamsData = filterRequestParams(paramsData, filterRequestValue)
        queryParams = newParamsData
        // setQueryParams(newParamsData)
        urlSearchParams = new URLSearchParams(newParamsData).toString()

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
    return () => null
  }

  return source$.pipe(
    op.map((props) => {
      const {
        useAntdTableOptions,
        blockAutoRequestFlag,
        paginationConfig,
        initParams,
        showSearchBar = true,
        useTableForm,
        editableConfig,
      } = props
      const defaultParams: any = [{ ...paginationConfig }, { ...initParams }]

      const onBefore = (params: AntdTableParams) => {
        if (editingRowKey && (editableConfig as Exclude<EditableConfigType, boolean>)?.editRowFlag) {
          setEditingRowKey('')
        }
        if (typeof useAntdTableOptions?.onBefore === 'function') {
          useAntdTableOptions?.onBefore(params)
        }
      }

      const finalUseAntdTableOptions = {
        onBefore,
        ...useAntdTableOptions,
        defaultParams,
        manual: !!blockAutoRequestFlag,
        ...(showSearchBar && useTableForm ? { form: searchFormRef?.current } : {}),
      }
      const tableDataPromise = getTableDataPromise(props)
      return {
        ...props,
        useAntdTableOptions: finalUseAntdTableOptions,
        subjectInfo: { tableDataPromise, queryParams, urlSearchParams },
      }
    })
  )
}
