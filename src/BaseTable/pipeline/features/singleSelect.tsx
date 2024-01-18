import type { TableRowSelection } from '@table/interface'
import React, { Key } from 'react'

import { CellProps, ColumnType } from '../../interfaces'
import { internals } from '../../internals'
import { mergeCellProps, SINGLE_SELECT_MARK_PROPNAME } from '../../utils'
import { always } from '../../utils/others'
import { TablePipeline } from '../pipeline'

export interface SingleSelectFeatureOptions<RecordType = any> {
  /** 是否高亮被选中的行 */
  highlightRowWhenSelected?: boolean

  /** 非受控用法：默认选中的值 */
  defaultValue?: Key[]

  /** 受控用法：当前选中的值 */
  value?: Key[]

  /** 受控用法：选中值改变回调 */
  onChange?: (selectedRowKeys: Key[], selectedRows: RecordType[], key: Key, keys: Key[], action: 'check') => void

  /** 判断一行是否禁用 */
  isDisabled?(row: RecordType, rowIndex: number): boolean

  /** 点击事件的响应区域 */
  clickArea?: 'radio' | 'cell' | 'row'

  /** 单选框所在列的 column 配置，可指定 width，fixed 等属性 */
  columnProps?: Partial<ColumnType<RecordType>>

  /** 单选框所在列的位置 */
  placement?: 'start' | 'end'

  /** 是否对触发 onChange 的 click 事件调用 event.stopPropagation() */
  stopClickEventPropagation?: boolean

  /** 选择框的默认属性配置 */
  getCheckboxProps?: TableRowSelection<RecordType>['getCheckboxProps']

  /** 用户手动选择/取消选择某行的回调 */
  onSelect?: TableRowSelection<RecordType>['onSelect']

  /** 自定义列表选择框标题 */
  columnTitle?: TableRowSelection<RecordType>['columnTitle']
}

export function singleSelect(opts: SingleSelectFeatureOptions = {}) {
  return function singleSelectStep(pipeline: TablePipeline) {
    const { Radio } = pipeline.ctx.components
    if (Radio == null) {
      throw new Error('Before using singleSelect, components need to be set through the pipeline context Radio')
    }

    const stateKey = 'singleSelect'
    const clickArea = opts.clickArea ?? 'radio'
    const isDisabled = opts.isDisabled ?? always(false)

    const rowKey = pipeline.ensurePrimaryKey('singleSelect')
    const value = opts.value?.[0] ?? pipeline.getStateAtKey(stateKey)?.[0] ?? opts.defaultValue?.[0]
    const onChange: (
      nextValue: Parameters<SingleSelectFeatureOptions['onChange']>[0],
      selectedRows: Parameters<SingleSelectFeatureOptions['onChange']>[1],
      key: Parameters<SingleSelectFeatureOptions['onChange']>[2],
      keys: Parameters<SingleSelectFeatureOptions['onChange']>[3],
      action: Parameters<SingleSelectFeatureOptions['onChange']>[4],
      e: React.MouseEvent | React.KeyboardEvent
    ) => void = (nextValue, selectedRows, key, keys, action, e) => {
      opts.onSelect(selectedRows?.[0], action === 'check', selectedRows, e as unknown as Event)
      opts.onChange?.(nextValue, selectedRows, key, keys, action)
      pipeline.setStateAtKey(stateKey, nextValue)
    }

    const renderColumnTitle = () => {
      if (!opts.columnTitle) {
        return null
      }
      if (typeof opts.columnTitle === 'function') {
        return opts.columnTitle(null)
      }
      return opts.columnTitle
    }

    const columnProps: ColumnType = {
      key: 'table-radio',
      name: '',
      align: 'center',
      title: renderColumnTitle(),
      ...opts.columnProps,
      width: opts.columnProps?.width ?? 50,
      getCellProps(val: any, row: any, rowIndex: number): CellProps {
        const preCellProps = opts.columnProps?.getCellProps?.(val, row, rowIndex)
        if (clickArea === 'cell') {
          const currentRowKey = internals.safeGetRowKey(rowKey, row, rowIndex)
          const checkboxProps = (opts.getCheckboxProps ? opts.getCheckboxProps(row) : null) || {}
          const disabled = checkboxProps.disabled || isDisabled(row, rowIndex)
          return mergeCellProps(preCellProps, {
            style: { cursor: disabled ? 'not-allowed' : 'pointer' },
            onClick: disabled
              ? undefined
              : (e) => {
                  if (opts.stopClickEventPropagation) {
                    e.stopPropagation()
                  }
                  onChange([currentRowKey], [row], currentRowKey, [currentRowKey], 'check', e)
                },
          })
        }
        return preCellProps
      },
      render: (_: any, row: any, rowIndex: number) => {
        if (row[pipeline.getFeatureOptions('footerRowMetaKey')]) {
          return null
        }
        const currentRowKey = internals.safeGetRowKey(rowKey, row, rowIndex)
        const checkboxProps = (opts.getCheckboxProps ? opts.getCheckboxProps(row) : null) || {}
        return (
          <Radio
            disabled={isDisabled(row, rowIndex)}
            style={{ marginRight: 0 }}
            {...checkboxProps}
            checked={value === currentRowKey}
            onChange={
              clickArea === 'radio'
                ? (arg1: any, arg2: any) => {
                    const nativeEvent: React.MouseEvent = arg2?.nativeEvent ?? arg1?.nativeEvent
                    if (nativeEvent && opts.stopClickEventPropagation) {
                      nativeEvent.stopPropagation()
                    }
                    onChange([currentRowKey], [row], currentRowKey, [currentRowKey], 'check', nativeEvent)
                  }
                : undefined
            }
          />
        )
      },
      features: {
        ...opts.columnProps?.features,
        [SINGLE_SELECT_MARK_PROPNAME]: true,
      },
    }

    const nextColumns = pipeline.getColumns().slice()

    const placement = opts.placement ?? 'start'
    if (placement === 'start') {
      nextColumns.unshift(columnProps)
    } else {
      nextColumns.push(columnProps)
    }

    pipeline.columns(nextColumns)

    pipeline.appendRowPropsGetter((row, rowIndex) => {
      const currentRowKey = internals.safeGetRowKey(rowKey, row, rowIndex)

      const style: any = {}
      let className: string
      let onClick: any

      if (opts.highlightRowWhenSelected) {
        if (value === currentRowKey) {
          className = 'highlight'
        }
      }
      if (clickArea === 'row' && !isDisabled(row, rowIndex)) {
        style.cursor = 'pointer'
        onClick = (e: React.MouseEvent) => {
          if (opts.stopClickEventPropagation) {
            e.stopPropagation()
          }
          onChange([currentRowKey], [row], currentRowKey, [currentRowKey], 'check', e)
        }
      }

      return { className, style, onClick }
    })

    return pipeline
  }
}
