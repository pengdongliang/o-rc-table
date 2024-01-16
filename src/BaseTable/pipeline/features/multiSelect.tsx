import { CellProps, ColumnType } from '../../interfaces'
import { internals } from '../../internals'
import { collectNodes, mergeCellProps, MULTI_SELECT_MARK_PROPNAME } from '../../utils'
import { always, arrayUtils } from '../../utils/others'
import { TablePipeline } from '../pipeline'

const fullRowsSetKey = 'fullRowsSetKey'
const allEnableKeys = 'allEnableKeys'
const selectValueSetKey = 'selectValueSetKey'

export interface MultiSelectFeatureOptions {
  /** 非受控用法：默认选中的值 */
  defaultValue?: string[]

  /** 非受控用法：默认 lastKey */
  defaultLastKey?: string

  /** 受控用法：当前选中的 keys */
  value?: string[]

  /** 受控用法：上一次操作对应的 currentRowKey */
  lastKey?: string

  /** 受控用法：状态改变回调  */
  onChange?: (
    nextValue: string[],
    key: string,
    keys: string[],
    action: 'check' | 'uncheck' | 'check-all' | 'uncheck-all'
  ) => void

  /** 复选框所在列的位置 */
  checkboxPlacement?: 'start' | 'end'

  /** 复选框所在列的 column 配置，可指定 width，fixed, title, align, features 等属性 */
  checkboxColumn?: Partial<ColumnType>

  /** 是否高亮被选中的行 */
  highlightRowWhenSelected?: boolean

  /** 判断一行中的 checkbox 是否要禁用 */
  isDisabled?(row: any, rowIndex: number): boolean

  /** 点击事件的响应区域 */
  clickArea?: 'checkbox' | 'cell' | 'row'

  /** 是否对触发 onChange 的 click 事件调用 event.stopPropagation() */
  stopClickEventPropagation?: boolean
}

export function multiSelect(opts: MultiSelectFeatureOptions = {}) {
  return function multiSelectStep(pipeline: TablePipeline) {
    const stateKey = 'multiSelect'
    const { Checkbox } = pipeline.ctx.components
    if (Checkbox == null) {
      throw new Error('使用 multiSelect 之前需要设置 pipeline.ctx.components.Checkbox')
    }
    const rowKey = pipeline.ensurePrimaryKey('multiSelect')

    const isDisabled = opts.isDisabled ?? always(false)
    const clickArea = opts.clickArea ?? 'checkbox'

    const value: string[] = opts.value ?? pipeline.getStateAtKey(stateKey)?.value ?? opts.defaultValue ?? []
    const lastKey: string = opts.lastKey ?? pipeline.getStateAtKey(stateKey)?.lastKey ?? opts.defaultLastKey ?? ''
    const onChange: MultiSelectFeatureOptions['onChange'] = (nextValue, key, keys, action) => {
      opts.onChange?.(nextValue, key, keys, action)
      pipeline.setStateAtKey(stateKey, { value: nextValue, lastKey: key }, { keys, action })
    }

    /** dataSource 中包含的所有 keys */
    let fullKeySet = new Set<string>()

    /** 所有有效的 keys（disable 状态为 false） */
    let allKeys: string[] = []

    let set = new Set(value)
    let isAllChecked = set.size !== 0 // 当前不存在选中则默认为false
    let isAnyChecked = false

    const flatDataSource = collectNodes(pipeline.getDataSource())
    flatDataSource.forEach((row, rowIndex) => {
      const currentRowKey = internals.safeGetRowKey(rowKey, row, rowIndex)
      fullKeySet.add(currentRowKey)
      // 在 allKeys 中排除被禁用的 key
      if (!isDisabled(row, rowIndex)) {
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

    // todo: 暂使用hidden隐藏选择列 后续增加配置
    const hiddenSelectColumn = opts.checkboxColumn && opts.checkboxColumn.hidden === true
    if (!hiddenSelectColumn) {
      const defaultCheckboxColumnTitle = (
        <Checkbox
          checked={isAllChecked}
          indeterminate={!isAllChecked && isAnyChecked}
          onChange={() => {
            const keys = pipeline.getFeatureOptions(allEnableKeys)
            if (isAllChecked) {
              onChange(arrayUtils.diff(value, keys), '', keys, 'uncheck-all')
            } else {
              onChange(arrayUtils.merge(value, keys), '', keys, 'check-all')
            }
          }}
        />
      )

      const checkboxColumn: ColumnType = {
        name: '是否选中',
        title: defaultCheckboxColumnTitle,
        width: 50,
        align: 'center',
        ...opts.checkboxColumn,
        getCellProps(val: any, row: any, rowIndex: number): CellProps {
          const currentRowKey = internals.safeGetRowKey(rowKey, row, rowIndex)
          let checkboxCellProps = {}
          const preCellProps = opts.checkboxColumn?.getCellProps?.(val, row, rowIndex)
          const fullRowsSet = pipeline.getFeatureOptions(fullRowsSetKey) || new Set<string>()
          const selectValueSet = pipeline.getFeatureOptions(selectValueSetKey) || new Set<string>()
          if (fullRowsSet.has(currentRowKey) && clickArea === 'cell') {
            const prevChecked = selectValueSet.has(currentRowKey)
            const disabled = isDisabled(row, rowIndex)
            checkboxCellProps = {
              style: { cursor: disabled ? 'not-allowed' : 'pointer' },
              onClick: disabled
                ? undefined
                : (e: { stopPropagation: () => void; shiftKey: boolean }) => {
                    if (opts.stopClickEventPropagation) {
                      e.stopPropagation()
                    }
                    onCheckboxChange(prevChecked, currentRowKey, e.shiftKey)
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
          return (
            <Checkbox
              checked={checked}
              disabled={isDisabled(row, rowIndex)}
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
                        onCheckboxChange(checked, key, nativeEvent.shiftKey)
                      }
                    }
                  : undefined
              }
            />
          )
        },
        features: {
          ...opts.checkboxColumn?.features,
          [MULTI_SELECT_MARK_PROPNAME]: true,
        },
      }

      const nextColumns = pipeline.getColumns().slice()
      const checkboxPlacement = opts.checkboxPlacement ?? 'start'
      if (checkboxPlacement === 'start') {
        nextColumns.unshift(checkboxColumn)
      } else {
        nextColumns.push(checkboxColumn)
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
            onCheckboxChange(checked, currentRowKey, e.shiftKey)
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

    function onCheckboxChange(prevChecked: boolean, key: string, batch: boolean) {
      let batchKeys = [key]

      if (batch && lastKey) {
        const keys = pipeline.getFeatureOptions(allEnableKeys)
        const lastIdx = keys.indexOf(lastKey)
        const cntIdx = keys.indexOf(key)
        const [start, end] = lastIdx < cntIdx ? [lastIdx, cntIdx] : [cntIdx, lastIdx]
        batchKeys = keys.slice(start, end + 1)
      }

      if (prevChecked) {
        onChange(arrayUtils.diff(value, batchKeys), key, batchKeys, 'uncheck')
      } else {
        onChange(arrayUtils.merge(value, batchKeys), key, batchKeys, 'check')
      }
    }
  }
}
