import { CellProps, ColumnType } from '../../interfaces'
import { always } from '../../utils/others'
import StrictTreeDataHelper from '../../utils/tree-data-helpers/StrictTreeDataHelper'
import TreeDataHelper from '../../utils/tree-data-helpers/TreeDataHelper'
import { TablePipeline } from '../pipeline'

export interface TreeSelectFeatureOptions {
  /** 完整的树 */
  tree: any[]

  /** 虚拟的根节点值；该参数非空时，treeSelect 将会在 tree 参数之上再添加一个父节点 */
  rootKey?: string

  /** 父子节点选中状态是否不再关联。设置为 true 之后，父节点和子节点的 value 独立管理，不再联动 */
  checkStrictly?: boolean

  /**
   * 定义选中时回填的方式，可选值:
   * - 'all'(返回所有选中的节点)
   * - 'parent'(父子节点都选中时只返回父节点)
   * - 'child'(父子节点都选中时只返回子节点)
   */
  checkedStrategy?: 'all' | 'parent' | 'child'

  /** 复选框所在列的位置 */
  checkboxPlacement?: 'start' | 'end'

  /** 复选框所在列的 column 配置，可指定 width，fixed, title, align, features 等属性 */
  checkboxColumn?: Partial<ColumnType>

  /** 受控用法：当前选中的值 */
  value?: string[]

  /** 非受控用法：默认选中的值 */
  defaultValue?: string[]

  /** 受控用法：状态改变回调 */
  onChange?(nextValue: string[]): void

  /** 点击事件的响应区域 */
  clickArea?: 'checkbox' | 'cell' | 'row'

  /** 是否对触发 onChange 的 click 事件调用 event.stopPropagation() */
  stopClickEventPropagation?: boolean

  /** 被选中时是否高亮整行 */
  highlightRowWhenSelected?: boolean

  /** 是否禁用该节点的交互 */
  isDisabled?(row: any): boolean

  /** 是否让该节点对应的子树 与其父节点脱离联动 */
  idDetached?(row: any): boolean
}

const STATE_KEY = 'treeSelect'

export function treeSelect(opts: TreeSelectFeatureOptions) {
  return function treeSelectStep(pipeline: TablePipeline) {
    const { Checkbox } = pipeline.ctx.components
    if (Checkbox == null) {
      throw new Error('使用 treeSelect 之前需要通过 pipeline context 设置 components.Checkbox')
    }
    const rowKey = pipeline.ensurePrimaryKey('treeSelect') as string
    if (typeof rowKey !== 'string') {
      throw new Error('treeSelect 仅支持字符串作为 rowKey')
    }
    const clickArea = opts.clickArea ?? 'checkbox'
    const isDisabled = opts.isDisabled ?? always(false)
    const isDetached = opts.idDetached ?? always(false)

    const value = opts.value ?? pipeline.getStateAtKey(STATE_KEY) ?? opts.defaultValue ?? []
    const tree = opts.rootKey != null ? [{ [rowKey]: opts.rootKey, children: opts.tree }] : opts.tree
    const getNodeValue = (node: any) => node[rowKey]

    const treeDataHelper = opts.checkStrictly
      ? new StrictTreeDataHelper({ value, getNodeValue, tree })
      : new TreeDataHelper({
          value,
          getNodeValue,
          isDetached,
          tree,
          checkedStrategy: opts.checkedStrategy ?? 'parent',
        })

    const onToggleKey = (key: string) => {
      const nextValue = treeDataHelper.getValueAfterToggle(key)
      pipeline.setStateAtKey(STATE_KEY, nextValue)
      opts.onChange?.(nextValue)
    }

    const makeCheckbox = (key: string, root: boolean, row?: any) => {
      return (
        <Checkbox
          checked={treeDataHelper.isChecked(key)}
          indeterminate={treeDataHelper.isIndeterminate(key)}
          disabled={!root && isDisabled(row)}
          onChange={clickArea === 'checkbox' || root ? () => onToggleKey(key) : undefined}
        />
      )
    }

    const checkboxColumn: ColumnType = {
      name: '',
      width: 50,
      align: 'center',
      title: opts.rootKey != null ? makeCheckbox(opts.rootKey, true) : undefined,
      ...opts.checkboxColumn,
      render(_val, record) {
        return makeCheckbox(record[rowKey], false, record)
      },
      getCellProps(_val: any, row: any): CellProps {
        const currentRowKey = row[rowKey]
        if (clickArea !== 'cell') {
          return
        }

        const disabled = isDisabled(row)
        if (disabled) {
          return { style: { cursor: 'not-allowed' } }
        }

        return {
          style: { cursor: 'pointer' },
          onClick(e) {
            if (opts.stopClickEventPropagation) {
              e.stopPropagation()
            }
            onToggleKey(currentRowKey)
          },
        }
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

    if (clickArea === 'row') {
      pipeline.appendRowPropsGetter((row) => {
        const disabled = isDisabled(row)
        if (!disabled) {
          return {
            style: { cursor: 'pointer' },
            onClick(e) {
              if (opts.stopClickEventPropagation) {
                e.stopPropagation()
              }
              onToggleKey(row[rowKey])
            },
          }
        }
      })
    }

    if (opts.highlightRowWhenSelected) {
      pipeline.appendRowPropsGetter((row) => {
        if (treeDataHelper.isChecked(row[rowKey])) {
          return { className: 'highlight' }
        }
      })
    }

    return pipeline
  }
}
