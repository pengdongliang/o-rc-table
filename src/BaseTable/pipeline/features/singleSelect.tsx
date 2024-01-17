import React, { Key } from 'react'

import { CellProps, ColumnType } from '../../interfaces'
import { internals } from '../../internals'
import { mergeCellProps, SINGLE_SELECT_MARK_PROPNAME } from '../../utils'
import { always } from '../../utils/others'
import { TablePipeline } from '../pipeline'

export interface SingleSelectFeatureOptions {
  /** 是否高亮被选中的行 */
  highlightRowWhenSelected?: boolean

  /** 非受控用法：默认选中的值 */
  defaultValue?: Key[]

  /** 受控用法：当前选中的值 */
  value?: Key[]

  /** 受控用法：选中值改变回调 */
  onChange?: (
    selectedRowKeys: Key[],
    selectedRows: Record<string, any>[],
    key: Key,
    keys: Key[],
    action: 'check'
  ) => void

  /** 判断一行是否禁用 */
  isDisabled?(row: any, rowIndex: number): boolean

  /** 点击事件的响应区域 */
  clickArea?: 'radio' | 'cell' | 'row'

  /** 单选框所在列的 column 配置，可指定 width，fixed 等属性 */
  columnProp?: Partial<ColumnType>

  /** 单选框所在列的位置 */
  placement?: 'start' | 'end'

  /** 是否对触发 onChange 的 click 事件调用 event.stopPropagation() */
  stopClickEventPropagation?: boolean
}

export function singleSelect(opts: SingleSelectFeatureOptions = {}) {
  return function singleSelectStep(pipeline: TablePipeline) {
    const { Radio } = pipeline.ctx.components
    if (Radio == null) {
      throw new Error('使用 singleSelect 之前需要通过 pipeline context 设置 components.Radio')
    }

    const stateKey = 'singleSelect'
    const clickArea = opts.clickArea ?? 'radio'
    const isDisabled = opts.isDisabled ?? always(false)

    const rowKey = pipeline.ensurePrimaryKey('singleSelect')
    const value = opts.value?.[0] ?? pipeline.getStateAtKey(stateKey) ?? opts.defaultValue?.[0]
    const onChange: SingleSelectFeatureOptions['onChange'] = (nextValue, selectedRows, key, keys, action) => {
      opts.onChange?.(nextValue, selectedRows, key, keys, action)
      pipeline.setStateAtKey(stateKey, nextValue)
    }

    const columnProp: ColumnType = {
      key: 'table-radio',
      name: '',
      align: 'center',
      ...opts.columnProp,
      width: opts.columnProp?.width ?? 50,
      getCellProps(val: any, row: any, rowIndex: number): CellProps {
        const preCellProps = opts.columnProp?.getCellProps?.(val, row, rowIndex)
        if (clickArea === 'cell') {
          const currentRowKey = internals.safeGetRowKey(rowKey, row, rowIndex)
          const disabled = isDisabled(row, rowIndex)
          return mergeCellProps(preCellProps, {
            style: { cursor: disabled ? 'not-allowed' : 'pointer' },
            onClick: disabled
              ? undefined
              : (e) => {
                  if (opts.stopClickEventPropagation) {
                    e.stopPropagation()
                  }
                  onChange([currentRowKey], [row], currentRowKey, [currentRowKey], 'check')
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
        return (
          <Radio
            style={{ marginRight: 0 }}
            checked={value?.[0] === currentRowKey}
            disabled={isDisabled(row, rowIndex)}
            onChange={
              clickArea === 'radio'
                ? (arg1: any, arg2: any) => {
                    const nativeEvent: MouseEvent = arg2?.nativeEvent ?? arg1?.nativeEvent
                    if (nativeEvent && opts.stopClickEventPropagation) {
                      nativeEvent.stopPropagation()
                    }
                    onChange([currentRowKey], [row], currentRowKey, [currentRowKey], 'check')
                  }
                : undefined
            }
          />
        )
      },
      features: {
        ...opts.columnProp?.features,
        [SINGLE_SELECT_MARK_PROPNAME]: true,
      },
    }

    const nextColumns = pipeline.getColumns().slice()

    const placement = opts.placement ?? 'start'
    if (placement === 'start') {
      nextColumns.unshift(columnProp)
    } else {
      nextColumns.push(columnProp)
    }

    pipeline.columns(nextColumns)

    pipeline.appendRowPropsGetter((row, rowIndex) => {
      const currentRowKey = internals.safeGetRowKey(rowKey, row, rowIndex)

      const style: any = {}
      let className: string
      let onClick: any

      if (opts.highlightRowWhenSelected) {
        if (value?.[0] === currentRowKey) {
          className = 'highlight'
        }
      }
      if (clickArea === 'row' && !isDisabled(row, rowIndex)) {
        style.cursor = 'pointer'
        onClick = (e: React.MouseEvent) => {
          if (opts.stopClickEventPropagation) {
            e.stopPropagation()
          }
          onChange([currentRowKey], [row], currentRowKey, [currentRowKey], 'check')
        }
      }

      return { className, style, onClick }
    })

    return pipeline
  }
}
