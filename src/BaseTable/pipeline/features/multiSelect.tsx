import type { TableRowSelection } from '@table/interface'
import type { CheckboxProps } from 'antd'
import { Key } from 'react'

import { CellProps, ColumnType } from '../../interfaces'
import { internals } from '../../internals'
import { collectNodes, mergeCellProps, MULTI_SELECT_MARK_PROPNAME } from '../../utils'
import { always, arrayUtils } from '../../utils/others'
import { TablePipeline } from '../pipeline'

const fullRowsSetKey = 'fullRowsSetKey'
const allEnableKeys = 'allEnableKeys'
const selectValueSetKey = 'selectValueSetKey'

export interface MultiSelectFeatureOptions<RecordType = any> {
  /** 非受控用法：默认选中的值 */
  defaultValue?: Key[]

  /** 非受控用法：默认 lastKey */
  defaultLastKey?: Key

  /** 受控用法：当前选中的 keys */
  value?: Key[]

  /** 受控用法：上一次操作对应的 currentRowKey */
  lastKey?: Key

  /** 受控用法：状态改变回调  */
  onChange?: (
    nextValue: Key[],
    selectedRows: RecordType[],
    key: Key,
    keys: Key[],
    action: 'check' | 'uncheck' | 'check-all' | 'uncheck-all'
  ) => void

  /** 复选框所在列的位置 */
  placement?: 'start' | 'end'

  /** 复选框所在列的 column 配置，可指定 width，fixed, title, align, features 等属性 */
  columnProps?: Partial<ColumnType>

  /** 是否高亮被选中的行 */
  highlightRowWhenSelected?: boolean

  /** 判断一行中的 checkbox 是否要禁用 */
  isDisabled?(row: RecordType, rowIndex?: number): boolean

  /** 点击事件的响应区域 */
  clickArea?: 'checkbox' | 'cell' | 'row'

  /** 是否对触发 onChange 的 click 事件调用 event.stopPropagation() */
  stopClickEventPropagation?: boolean

  /** 选择框的默认属性配置 */
  getCheckboxProps?: TableRowSelection<RecordType>['getCheckboxProps']

  /** 用户手动选择/取消选择某行的回调 */
  onSelect?: TableRowSelection<RecordType>['onSelect']

  /** 自定义列表选择框标题 */
  columnTitle?: TableRowSelection<RecordType>['columnTitle']

  /** 隐藏全选勾选框与自定义选择项 */
  hideSelectAll?: TableRowSelection<RecordType>['hideSelectAll']

  /** 用户手动选择/取消选择所有行的回调 */
  onSelectAll?: TableRowSelection<RecordType>['onSelectAll']
}

export function multiSelect(opts: MultiSelectFeatureOptions = {}) {
  return function multiSelectStep(pipeline: TablePipeline) {
    const stateKey = 'multiSelect'
    const { Checkbox } = pipeline.ctx.components
    if (Checkbox == null) {
      throw new Error('Before using MultiSelect, you need to set pipeline.ctx.components.Checkbox')
    }
    const rowKey = pipeline.ensurePrimaryKey(stateKey) as string

    const isDisabled = opts.isDisabled ?? always(false)
    const clickArea = opts.clickArea ?? 'checkbox'

    const value: string[] = opts.value ?? pipeline.getStateAtKey(stateKey)?.value ?? opts.defaultValue ?? []
    const lastKey: string = opts.lastKey ?? pipeline.getStateAtKey(stateKey)?.lastKey ?? opts.defaultLastKey ?? ''
    const onChange: MultiSelectFeatureOptions['onChange'] = (nextValue, selectedRows, key, keys, action) => {
      opts.onChange?.(nextValue, selectedRows, key, keys, action)
      pipeline.setStateAtKey(stateKey, { value: nextValue, lastKey: key }, { keys, action })
    }

    /** dataSource 中包含的所有 keys */
    let fullKeySet = new Set<string>()

    /** 所有有效的 keys（disable 状态为 false） */
    let allKeys: string[] = []

    let set = new Set(value)
    let isAllChecked = set.size !== 0 // 当前不存在选中则默认为false
    let isAnyChecked = false
    const checkboxPropsMap = new Map<Key, Partial<CheckboxProps>>()

    const flatDataSource = collectNodes(pipeline.getDataSource())

    flatDataSource.forEach((row, rowIndex) => {
      const currentRowKey = internals.safeGetRowKey(rowKey, row, rowIndex)
      fullKeySet.add(currentRowKey)
      const checkboxProps = (opts.getCheckboxProps ? opts.getCheckboxProps(row) : null) || {}
      checkboxPropsMap.set(currentRowKey, checkboxProps)
      // 在 allKeys 中排除被禁用的 key
      if (!checkboxProps.disabled && !isDisabled(row, rowIndex)) {
        allKeys.push(currentRowKey)

        // 存在一个非选中，则不再进行判断
        if (isAllChecked) {
          isAllChecked = set.has(currentRowKey)
        }
        // 存在一个选中，则不再进行判断
        if (!isAnyChecked) {
          isAnyChecked = set.has(currentRowKey)
        }
      }
    })

    const getSelectedRows = (list: string[]) => {
      return flatDataSource?.filter((r, index) => {
        const keyValue = internals.safeGetRowKey(rowKey, r, index)
        return list?.includes(keyValue)
      })
    }

    const allDisabled = !allKeys.length

    // todo: 暂使用hidden隐藏选择列 后续增加配置
    const hiddenSelectColumn = opts.columnProps && opts.columnProps.hidden === true
    if (!hiddenSelectColumn) {
      const defaultCheckboxColumnTitle = (
        <Checkbox
          checked={isAllChecked}
          indeterminate={!isAllChecked && isAnyChecked}
          onChange={(e: Event) => {
            const keys = pipeline.getFeatureOptions(allEnableKeys)
            const list = isAllChecked ? arrayUtils.diff(value, keys) : arrayUtils.merge(value, keys)
            const selectedRows = getSelectedRows(list)
            if (isAllChecked) {
              opts.onSelect?.(selectedRows, true, selectedRows, e)
              onChange(list, selectedRows, '', keys, 'uncheck-all')
            } else {
              opts.onSelect?.(selectedRows, false, selectedRows, e)
              onChange(list, selectedRows, '', keys, 'check-all')
            }

            const changeRows = selectedRows?.filter((r, index) => {
              const keyValue = internals.safeGetRowKey(rowKey, r, index)
              return !value?.includes(keyValue)
            })
            opts.onSelectAll?.(!isAllChecked, selectedRows, changeRows)
          }}
          disabled={flatDataSource.length === 0 || allDisabled}
          skipGroup
        />
      )

      const renderColumnTitle = () => {
        if (!opts.columnTitle) {
          return !opts.hideSelectAll && defaultCheckboxColumnTitle
        }
        if (typeof opts.columnTitle === 'function') {
          return opts.columnTitle(defaultCheckboxColumnTitle)
        }
        return opts.columnTitle
      }

      const columnProps: ColumnType = {
        key: 'table-checkbox',
        name: '',
        title: renderColumnTitle(),
        align: 'center',
        ...opts.columnProps,
        width: opts.columnProps?.width ?? 50,
        getCellProps(val: any, row: any, rowIndex: number): CellProps {
          const currentRowKey = internals.safeGetRowKey(rowKey, row, rowIndex)
          let checkboxCellProps = {}
          const preCellProps = opts.columnProps?.getCellProps?.(val, row, rowIndex)
          const fullRowsSet = pipeline.getFeatureOptions(fullRowsSetKey) || new Set<string>()
          const selectValueSet = pipeline.getFeatureOptions(selectValueSetKey) || new Set<string>()
          if (fullRowsSet.has(currentRowKey) && clickArea === 'cell') {
            const prevChecked = selectValueSet.has(currentRowKey)
            const checkboxProps = checkboxPropsMap.get(currentRowKey)
            const disabled = checkboxProps?.disabled || isDisabled(row, rowIndex)
            checkboxCellProps = {
              style: { cursor: disabled ? 'not-allowed' : 'pointer' },
              onClick: disabled
                ? undefined
                : (e: { stopPropagation: () => void; shiftKey: boolean }) => {
                    if (opts.stopClickEventPropagation) {
                      e.stopPropagation()
                    }
                    onCheckboxChange(prevChecked, currentRowKey, e as MouseEvent, row)
                  },
            }
          }
          return mergeCellProps(preCellProps, checkboxCellProps)
        },
        render(_: any, row: any, rowIndex: number) {
          if (row[pipeline.getFeatureOptions('footerRowMetaKey')]) {
            return null
          }
          const key = internals.safeGetRowKey(rowKey, row, rowIndex)
          const selectValueSet = pipeline.getFeatureOptions(selectValueSetKey) || new Set<string>()
          const checked = selectValueSet.has(key)
          const checkboxProps = checkboxPropsMap.get(key)

          return (
            <Checkbox
              disabled={isDisabled(row, rowIndex)}
              {...checkboxProps}
              checked={checked}
              onChange={
                clickArea === 'checkbox'
                  ? (arg1: any, arg2: any) => {
                      // 这里要同时兼容 antd 和 fusion 的用法
                      // fusion: arg2?.nativeEvent
                      // antd: arg1.nativeEvent
                      const nativeEvent: MouseEvent = arg2?.nativeEvent ?? arg1.nativeEvent
                      if (nativeEvent) {
                        if (opts.stopClickEventPropagation) {
                          nativeEvent.stopPropagation()
                        }
                        onCheckboxChange(checked, key, nativeEvent, row)
                      }
                    }
                  : undefined
              }
            />
          )
        },
        features: {
          ...opts.columnProps?.features,
          [MULTI_SELECT_MARK_PROPNAME]: true,
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
    }

    pipeline.appendRowPropsGetter((row, rowIndex) => {
      const currentRowKey = internals.safeGetRowKey(rowKey, row, rowIndex)
      const fullRowsSet = pipeline.getFeatureOptions(fullRowsSetKey) || new Set<string>()
      if (!fullRowsSet.has(currentRowKey)) {
        // currentRowKey 不在 fullKeySet 中说明这一行是在 multiSelect 之后才生成的，multiSelect 不对之后生成的行进行处理
        return
      }

      const style: any = {}
      let className: string
      let onClick: any

      const selectValueSet = pipeline.getFeatureOptions(selectValueSetKey) || new Set<string>()
      const checked = selectValueSet.has(currentRowKey)
      if (opts.highlightRowWhenSelected && checked) {
        className = 'highlight'
      }

      if (clickArea === 'row') {
        const disabled = isDisabled(row, rowIndex)
        if (!disabled) {
          style.cursor = 'pointer'
          onClick = (e: MouseEvent) => {
            if (opts.stopClickEventPropagation) {
              e.stopPropagation()
            }
            onCheckboxChange(checked, currentRowKey, e, row)
          }
        }
      }

      return { className, style, onClick }
    })

    // 只保留一份到pipeline， 避免行数据过多时内容被握住
    pipeline.setFeatureOptions(fullRowsSetKey, fullKeySet)
    pipeline.setFeatureOptions(allEnableKeys, allKeys)
    pipeline.setFeatureOptions(selectValueSetKey, set)
    fullKeySet = null
    allKeys = null
    set = null

    return pipeline

    function onCheckboxChange(prevChecked: boolean, key: string, e: MouseEvent | KeyboardEvent, row: any) {
      const batch = e.shiftKey
      let batchKeys = [key]

      if (batch && lastKey) {
        const keys = pipeline.getFeatureOptions(allEnableKeys)
        const lastIdx = keys.indexOf(lastKey)
        const cntIdx = keys.indexOf(key)
        const [start, end] = lastIdx < cntIdx ? [lastIdx, cntIdx] : [cntIdx, lastIdx]
        batchKeys = keys.slice(start, end + 1)
      }

      if (prevChecked) {
        const list = arrayUtils.diff(value, batchKeys)
        const selectedRows = getSelectedRows(list)
        opts.onSelect?.(row, !prevChecked, selectedRows, e)
        onChange(list, selectedRows, key, batchKeys, 'uncheck')
      } else {
        const list = arrayUtils.merge(value, batchKeys)
        const selectedRows = getSelectedRows(list)
        opts.onSelect?.(row, !prevChecked, selectedRows, e)
        onChange(list, selectedRows, key, batchKeys, 'check')
      }
    }
  }
}
