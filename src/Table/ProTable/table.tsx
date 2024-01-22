import { Global } from '@emotion/react'
import { RequestHandlerArgs, RequestOptions, type TableConfigType, useThemeContext } from '@ocloud/admin-context'
import { usePaginationConfig } from '@ocloud/admin-hooks'
import type { FormRef } from '@ocloud/antd'
import {
  Empty,
  FormOptionsType,
  OSearchForm,
  Space,
  Spin,
  Table as ATable,
  TableProps as ATableProps,
} from '@ocloud/antd'
import { useCreation, useMemoizedFn, useUpdateEffect } from 'ahooks'
import type { AntdTableOptions, Params as AntdTableParams } from 'ahooks/es/useAntdTable/types'
import React, { useImperativeHandle, useRef, useState } from 'react'

import type { AnyObject } from '../../theme/interface'
import type { TableRef as OTableRef } from '../index'
import { Table as RcTable, TableProps as RcTableProps } from '../index'
import type { PaginationConfigType } from './config'
import { defaultPaginationConfig } from './config'
import { TableLayout } from './container/TableLayout'
import { StyledTableLayoutReplaceBox } from './container/TableLayout/styled'
import { TableContextType, TableProvider } from './context'
import { useDefaultTableConfig } from './hooks/useDefaultTableConfig'
import { TableColumnTypes, useTableColumns } from './hooks/useTableColumns'
import { useTableParamsData, UseTableParamsDataResultType } from './hooks/useTableParamsData'
import { moreActionsCellStyle, TableContainerStyled } from './styled'

export interface TableInstance extends UseTableParamsDataResultType, Pick<TableProps, 'dataSource'> {
  /** 搜索栏Form Ref */
  searchFormRef?: FormRef
  /** 获取多选框勾选中的行数据, 默认不传参返回key数组, 传true返回行数据数组 */
  getSelectedRowKeys?: (rowFlag?: boolean) => React.Key[] | Record<string, any>[]
  /** 设置多选框勾选中的key数组 */
  setSelectedRowKeys?: (keys: React.Key[]) => void
  /** 获取展开行key数组 */
  getExpandedRowKeys?: () => React.Key[]
  /** 设置展开行key数组 */
  setExpandedRowKeys?: (keys: React.Key[]) => void
}

export interface EditArgumentsType {
  /** 当前行数据 */
  record: Record<string, any>
  /** 当前编辑的值 */
  fieldValue: any
  /** 当前编辑的字段名 */
  fieldName: string | number
  /** 编辑行的行表单数据 */
  fieldsValue: {
    [k: string]: any
  }
}

export type EditableConfigType =
  | {
      onChange: (args: EditArgumentsType) => void
      editRowFlag?: boolean
    }
  | boolean

export type UseAntdRowItemType = {
  total: number
  list: any[]
}

export interface UseAntdTablePaginationType {
  current: number
  pageSize: number
  sorter?: any
  filter?: any
  extra?: any
}

export type UseAntdTableOptionsType = AntdTableOptions<UseAntdRowItemType, AntdTableParams>

export type TableRef = TableInstance

export interface TableProps<RecordType extends AnyObject = AnyObject> extends Omit<ATableProps<RecordType>, 'columns'> {
  /** 扩展后的columns */
  columns: TableColumnTypes<RecordType>[]
  /** useAntd使用的options */
  useAntdTableOptions?: UseAntdTableOptionsType
  /** 初始化分页配置 */
  initPaginationConfig?: PaginationConfigType
  /** 初始参数, 分页初始参数不要放里面 */
  initParams?: Record<string, any>
  /** 是否阻止初始自动请求 */
  blockAutoRequestFlag?: boolean | 'auto'
  /** 是否使用搜索栏, 默认true */
  showSearchBar?: boolean
  /** 编辑表格的配置参数 */
  editableConfig?: EditableConfigType
  /** 表格请求字段名 */
  tableRequestFields?: TableConfigType
  /** 是否在最左边显示序列号, 从多少开始, 默认从1开始 */
  serialNumber?: boolean | number
  /** 过滤请求参数值, 默认过滤`undefined和""` */
  filterRequestValue?: RequestOptions['filterRequestValue']
  /** 禁用内置的表单和按钮 */
  disabled?: boolean
  /** 可伸缩列宽, 默认true */
  resizable?: boolean
  /**
   * @description 自定义表格容器元素
   * @default 表格页面Layout
   */
  containerNode?: keyof React.ReactDOM | React.ComponentType<any>
  /** 简单表单, 非表格页面, 内置默认{serialNumber: false,showSearchBar: false,containerNode: 'div'} */
  simple?: boolean
  /** 高级表格 */
  proTable?: boolean
  /**
   * @description 更多操作栏, 超出多少数量显示更多操作栏
   * @default 4个
   */
  moreActions?: false | number
  /** 请求数据, string: 请求api, 默认get请求方式, RequestOptions: 配置请求, Function: 回调请求 */
  request?: string | ((options: RequestHandlerArgs) => Promise<Record<string, any>>)
  /** 传入request为字符串时使用的自定义请求options */
  requestOptions?: (args: { params: Record<string, any> }) => Partial<RequestOptions>
  /** 回调方法处理请求返回的数据 */
  responseDataHandler?: (data: Record<string, any>, res?: Record<string, any>) => Record<string, any>
  /** 使用搜索栏的表单配置参数 */
  useTableForm?: FormOptionsType & {
    /** 搜索栏搜索表单方法 */
    onSubmit?: (internalSubmit: () => void) => void
    /** 搜索栏重置表单方法 */
    onReset?: (internalReset: () => void) => void
  }
  /** 在请求之前额外处理请求参数 */
  requestParamsHandler?: (
    /** 分页参数 */
    searchParams: UseAntdTablePaginationType,
    /** 表单参数 */
    formData: Record<string, unknown>,
    /** 其它参数, 如: 排序 */
    extraParams?: Record<string, any>
  ) => {
    /** 分页数据 */
    searchParams: UseAntdTablePaginationType
    /** 表单数据 */
    formData: Record<string, unknown>
  }
}

/**
 * 高级表格
 */
const InternalTable = <RecordType extends AnyObject = AnyObject>(
  props: TableProps<RecordType>,
  ref: React.Ref<TableRef>
) => {
  const [editingRowKey, setEditingRowKey] = useState('')
  const [locale, setLocale] = useState<TableProps['locale']>({ emptyText: <div /> })
  const searchFormRef = useRef<FormRef>(null)
  const tableContainerRef = useRef<HTMLDivElement | null>(null)
  const oTableRef = useRef<OTableRef>(null)

  const { antdTheme } = useThemeContext()
  const finalTableConfig = useDefaultTableConfig<RecordType>(props)
  const {
    columns,
    useAntdTableOptions,
    initPaginationConfig = defaultPaginationConfig,
    initParams,
    blockAutoRequestFlag,
    showSearchBar = true,
    useTableForm,
    editableConfig,
    serialNumber = true,
    pagination: paginationProps,
    disabled,
    resizable = true,
    containerNode,
    children,
    rowKey,
    moreActions = 4,
    rowClassName,
  } = finalTableConfig

  const { paginationConfig, paginationVisible } = usePaginationConfig({ initPaginationConfig, paginationProps })

  const defaultParams = useCreation(() => [{ ...paginationConfig }, { ...initParams }], [paginationConfig, initParams])
  const onBefore = (params: AntdTableParams) => {
    if (editingRowKey && (editableConfig as Exclude<EditableConfigType, boolean>)?.editRowFlag) {
      setEditingRowKey('')
    }
    if (typeof useAntdTableOptions?.onBefore === 'function') {
      useAntdTableOptions?.onBefore(params)
    }
  }
  const realUseAntdTableOptions = {
    onBefore,
    ...useAntdTableOptions,
    defaultParams,
    manual: blockAutoRequestFlag,
    ...(showSearchBar && useTableForm ? { form: searchFormRef?.current } : {}),
  } as UseAntdTableOptionsType
  const tableParamsData = useTableParamsData({
    ...finalTableConfig,
    useAntdTableOptions: realUseAntdTableOptions,
  })
  const { tableProps } = tableParamsData
  const run = useMemoizedFn((args = {}) => {
    const { current, pageSize } = paginationConfig
    tableParamsData.run({ current, pageSize }, { ...args })
  })

  const realDisabled = useCreation(() => disabled || tableParamsData?.loading, [disabled, tableParamsData?.loading])

  const dataSource = useCreation(() => {
    return Array.isArray(tableParamsData?.data?.list) && tableParamsData?.data?.list?.length
      ? tableParamsData?.data?.list
      : finalTableConfig?.dataSource
  }, [finalTableConfig?.dataSource, tableParamsData?.data?.list])

  useUpdateEffect(() => {
    if (blockAutoRequestFlag === 'auto') run({ ...tableParamsData?.params?.[1], ...initParams })
  }, [initParams])

  const { realColumns, customTableData } = useTableColumns({
    columns,
    editableConfig,
    serialNumber,
    disabled: realDisabled,
    resizable,
    tableContainerRef,
    moreActions,
    rowClassName,
  })

  const TableContextData = useCreation<TableContextType>(
    () => ({
      searchFormRef,
      rowKey: typeof rowKey === 'function' ? '' : rowKey,
      editingRowKey,
      setEditingRowKey,
    }),
    [editingRowKey, rowKey]
  )

  const tableInstance = useCreation(() => {
    return {
      ...tableParamsData,
      run,
      searchFormRef: searchFormRef?.current,
      dataSource,
    }
  }, [dataSource, run, tableParamsData])

  useImperativeHandle(ref, () => tableInstance)

  const pagination = useCreation(() => {
    if (paginationVisible === false) return false
    return {
      ...paginationConfig,
      ...tableProps?.pagination,
      ...finalTableConfig?.pagination,
    }
  }, [paginationConfig, finalTableConfig?.pagination, tableProps?.pagination, paginationVisible])

  const Component = useCreation(() => containerNode ?? TableLayout, [containerNode])

  useUpdateEffect(() => {
    const content = realDisabled ? <div /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
    setLocale({ emptyText: content })
  }, [realDisabled])

  const tableConfig = {
    locale,
    ...customTableData,
    ...finalTableConfig,
    ...tableProps,
    rowClassName: customTableData?.rowClassName ?? finalTableConfig?.rowClassName,
    pagination,
    dataSource,
    columns: realColumns,
    loading: !!finalTableConfig?.loading,
    className: 'table_container',
    ref: oTableRef,
  }

  return (
    <TableProvider value={TableContextData}>
      <Component {...(containerNode ? {} : { pagination })}>
        <StyledTableLayoutReplaceBox className={!containerNode ? 'layout-table-page' : ''}>
          <Spin spinning={realDisabled}>
            <Space direction="vertical" style={{ display: 'flex' }} size={10} className="layout-table-split">
              {showSearchBar && useTableForm ? (
                <OSearchForm
                  initParams={initParams}
                  formOptions={{ itemCount: containerNode ? 999 : useTableForm?.itemCount, ...useTableForm }}
                  ref={searchFormRef}
                  className="table-search-form_container"
                  onSubmit={(...args) => {
                    if (typeof useTableForm?.onSubmit === 'function') {
                      useTableForm?.onSubmit?.(tableParamsData?.search?.submit, ...args)
                    } else {
                      tableParamsData?.search?.submit()
                    }
                    oTableRef.current?.initScrollBar()
                  }}
                  onReset={(...args) => {
                    if (typeof useTableForm?.onReset === 'function') {
                      useTableForm?.onReset?.(tableParamsData?.search?.reset, ...args)
                    } else {
                      tableParamsData?.search?.reset()
                    }
                    oTableRef.current?.initScrollBar()
                  }}
                />
              ) : null}
              <TableContainerStyled ref={tableContainerRef}>
                {children ? <div className="table_before_cotainer">{children}</div> : null}
                <RcTable {...(tableConfig as unknown as RcTableProps)} />
              </TableContainerStyled>
            </Space>
          </Spin>
        </StyledTableLayoutReplaceBox>
      </Component>
      <Global styles={moreActionsCellStyle(antdTheme)} />
    </TableProvider>
  )
}

const Table = React.forwardRef(InternalTable) as unknown as (<RecordType extends AnyObject = AnyObject>(
  props: React.PropsWithChildren<TableProps<RecordType>> & {
    ref?: React.Ref<TableRef>
  }
) => React.ReactElement) & {
  displayName?: string
  SELECTION_COLUMN: typeof ATable.SELECTION_COLUMN
  EXPAND_COLUMN: typeof ATable.EXPAND_COLUMN
  SELECTION_ALL: typeof ATable.SELECTION_ALL
  SELECTION_INVERT: typeof ATable.SELECTION_INVERT
  SELECTION_NONE: typeof ATable.SELECTION_NONE
  Column: typeof ATable.Column
  ColumnGroup: typeof ATable.ColumnGroup
  Summary: typeof ATable.Summary
}

Table.SELECTION_COLUMN = ATable.SELECTION_COLUMN
Table.EXPAND_COLUMN = ATable.EXPAND_COLUMN
Table.SELECTION_ALL = ATable.SELECTION_ALL
Table.SELECTION_INVERT = ATable.SELECTION_INVERT
Table.SELECTION_NONE = ATable.SELECTION_NONE
Table.Column = ATable.Column
Table.ColumnGroup = ATable.ColumnGroup
Table.Summary = ATable.Summary

if (process.env.NODE_ENV !== 'production') {
  Table.displayName = 'Table'
}

export { Table }
