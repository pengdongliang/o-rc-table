import { useLocale, useThemeContext } from '@ocloud/admin-context'
import { getTableTextWidth } from '@ocloud/admin-utils'
import type { ColumnGroupType, ColumnType, FormItemProps, FormProps, TooltipProps } from '@ocloud/antd'
import { Tooltip } from '@ocloud/antd'
import { useCreation } from 'ahooks'
import React, { useState } from 'react'

import { EditableCell } from '../components/EditableCell'
import { EditableRow } from '../components/EditableRow'
import type { EditableConfigType, EditArgumentsType, TableProps } from '../table'

/** 排序配置 */
export interface SortConfigType {
  /** 排序请求字段 默认为[order, orderField] */
  sortFieldsName?: [string, string]
  /** 排序字段的名称, 默认是column的dataIndex */
  orderFieldName?: 'lowerLine' | 'smallHump' | ((str: string) => string)
}

/**
 * 编辑类型
 */
export type EditableType =
  | {
      handleSave: (args: EditArgumentsType) => void
    }
  | boolean

/**
 * Table表格columns属性类型
 */
export interface TableColumnObjTypes<T = Record<string, any>>
  extends Partial<ColumnGroupType<T>>,
    Partial<ColumnType<T>> {
  /** 当前单元格是否可以编辑 */
  editable?: EditableType
  /** 当前单元格是否可以自定义显示Tooltip */
  tooltip?: boolean | TooltipProps
  /** 编辑行/单元格表单Form配置props */
  formProps?: FormProps
  /** 编辑行/单元格表单Item配置props */
  formItemProps?: FormItemProps
  /** 排序配置 */
  sortConfig?: SortConfigType
  /** 可伸缩列宽, 默认true, table props.resizable需开启才生效 */
  resizable?: boolean
}

/**
 * Table表格columns属性数组类型
 */
export type TableColumnTypes<T = Record<string, any>> = TableColumnObjTypes<T>

/**
 * columns处理钩子props类型
 */
export interface UseTableColumnsPropsType<T = Record<string, any>>
  extends Pick<TableProps<T>, 'resizable' | 'moreActions' | 'rowClassName'> {
  /** 表格columns属性 */
  columns: TableColumnTypes<T>[]
  /** props配置的编辑参数 */
  editableConfig?: EditableConfigType
  /** 序号 */
  serialNumber?: boolean | number
  /** 禁用内置表单 */
  disabled?: boolean
  /** 表格内容高度 */
  tableContainerRef: React.RefObject<HTMLDivElement>
}

export interface UseTableColumnsReturnType {
  realColumns: TableColumnTypes[]
  customTableData: Pick<TableProps, 'components' | 'rowClassName'>
  hasColumnEditable: boolean
}

/**
 * 表格columns处理
 */
export const useTableColumns = <T = Record<string, any>,>(props: UseTableColumnsPropsType<T>) => {
  const { columns, editableConfig, serialNumber, disabled, resizable, moreActions, rowClassName } = props
  const [hasColumnEditable, setHasColumnEditable] = useState(false)

  const { formatMessage } = useLocale()
  const { namespace } = useThemeContext()

  const realColumns: TableColumnTypes<T>[] = useCreation(() => {
    const { onChange, editRowFlag } = (editableConfig as Exclude<EditableConfigType, boolean>) ?? {}
    const mapCol = columns?.map((col) => {
      const { editable, tooltip, dataIndex, render, title } = col
      let newCol: TableColumnTypes<T> = {
        key: dataIndex as TableColumnTypes<T>['key'],
        width: getTableTextWidth(title as string),
        ...(dataIndex === 'opt'
          ? { className: `${namespace}-table-cell_text_align_center`, fixed: 'right', align: 'center' }
          : { ellipsis: true }),
        ...col,
      }
      if (tooltip) {
        const tooltipProps =
          Object.prototype.toString.call(tooltip).match(/^\[object\s(.*)\]$/)?.[1] === 'Object'
            ? (tooltip as TooltipProps)
            : {}
        newCol = {
          ...newCol,
          render: (text: string, record: Record<string, any>, index: number) => (
            <Tooltip placement="topLeft" destroyTooltipOnHide title={text} color="orange" {...tooltipProps}>
              <div
                style={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                  const target = e.target as HTMLDivElement
                  if (target.clientWidth >= target.scrollWidth) {
                    target.style.pointerEvents = 'none'
                    if (render) {
                      e.currentTarget.style.pointerEvents = 'none'
                    }
                  }
                }}
              >
                {render ? render(text, record, index) : text}
              </div>
            </Tooltip>
          ),
        }
      }
      if (((!editable && dataIndex !== 'opt') || (!editRowFlag && dataIndex === 'opt')) && !moreActions) {
        return newCol
      }
      if (editable && !hasColumnEditable) {
        setHasColumnEditable(true)
      }
      const { handleSave } = (editable ?? {}) as Exclude<EditableType, boolean>
      const changeHandler = editRowFlag ? onChange : handleSave || onChange
      if (changeHandler || moreActions) {
        return {
          ...newCol,
          onCell: ((record: Record<string, any>, rowIndex: number) => {
            return {
              ...newCol,
              record,
              rowIndex,
              changeHandler,
              editRowFlag,
              disabled,
              moreActions,
              ...col?.onCell?.(record, rowIndex),
              title: undefined,
            }
          }) as TableColumnTypes<T>['onCell'],
        }
      }
      return newCol
    })
    if (Array.isArray(mapCol) && mapCol.length && (serialNumber === 0 || serialNumber)) {
      const numberFormat = formatMessage({ id: 'common.serialNumber', defaultMessage: '序号' })
      mapCol.unshift({
        title: numberFormat,
        dataIndex: 'serial$number',
        width: getTableTextWidth(numberFormat) + 10,
        fixed: !!mapCol[0]?.fixed,
        align: 'center',
        render: (_text: any, _record: any, index: number) => {
          return index + (typeof serialNumber === 'number' ? serialNumber : 1)
        },
        key: 'serial$number',
        className: `serial$number ${namespace}-table-cell_text_align_center`,
      })
    }
    return mapCol
  }, [
    formatMessage,
    columns,
    // disabled,
    moreActions,
    editableConfig,
    hasColumnEditable,
    serialNumber,
  ]) as TableColumnTypes<T>[]

  const customTableData = useCreation<Partial<TableProps<T>>>(() => {
    let obj = {}
    if (hasColumnEditable || moreActions) {
      obj = {
        ...obj,
        body: {
          row: hasColumnEditable ? EditableRow : undefined,
          cell: EditableCell,
        },
      }
    }
    if (JSON.stringify(obj) === '{}') {
      return {}
    }
    return {
      components: obj,
      ...(hasColumnEditable
        ? {
            rowClassName: (record: Record<string, any>, index: number) => {
              return (
                'table-editable-row' +
                ` ${typeof rowClassName === 'string' ? rowClassName : rowClassName?.(record, index, null)}`
              )
            },
          }
        : {}),
    }
  }, [hasColumnEditable, resizable])

  return { realColumns, customTableData, hasColumnEditable }
}
