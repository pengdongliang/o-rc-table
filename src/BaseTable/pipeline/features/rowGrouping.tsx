import cx from 'classnames'
import React from 'react'

import { ExpansionCell, icons, InlineFlexCell } from '../../common-views'
import { ColumnType } from '../../interfaces'
import { internals } from '../../internals'
import { collectNodes, isLeafNode, mergeCellProps } from '../../utils'
import { flatMap } from '../../utils/others'
import { TablePipeline } from '../pipeline'

const groupingMetaSymbol = Symbol('row-grouping-meta')

function attachGroupingMeta(row: any) {
  return { [groupingMetaSymbol]: { expandable: !isLeafNode(row) }, ...row }
}

function getGroupingMeta(row: any): { isGroupHeader: boolean; expandable: boolean } {
  if (row[groupingMetaSymbol] == null) {
    return { isGroupHeader: false, expandable: false }
  }
  return { isGroupHeader: true, expandable: row[groupingMetaSymbol].expandable }
}

function rowGroupingRowPropsGetter(row: any) {
  if (getGroupingMeta(row).isGroupHeader) {
    return { className: 'alternative' }
  }
}

export interface RowGroupingFeatureOptions {
  /** 非受控用法：是否默认展开所有分组 */
  defaultExpandAllRows?: boolean

  /** 非受控用法：默认展开的 keys */
  defaultOpenKeys?: string[]

  /** 受控用法：当前展开的 keys */
  openKeys?: string[]

  /** 受控用法：当前展开 keys 改变回调 */
  onChangeOpenKeys?(nextKeys: string[], key: string, action: 'expand' | 'collapse'): void

  /** 是否对触发 onChangeOpenKeys 的 click 事件调用 event.stopPropagation() */
  stopClickEventPropagation?: boolean
}

export function rowGrouping(opts: RowGroupingFeatureOptions = {}) {
  return (pipeline: TablePipeline) => {
    const stateKey = 'rowGrouping'
    const { indents } = pipeline.ctx
    const textOffset = indents.iconIndent + indents.iconWidth + indents.iconGap

    const rowKey = pipeline.ensurePrimaryKey('rowGrouping') as string
    if (typeof rowKey !== 'string') {
      throw new Error('rowGrouping 仅支持字符串作为 rowKey')
    }
    const openKeys: string[] =
      opts.openKeys ??
      pipeline.getStateAtKey(stateKey) ??
      (opts.defaultExpandAllRows ? pipeline.getDataSource().map((row) => row[rowKey]) : opts.defaultOpenKeys) ??
      []
    const openKeySet = new Set(openKeys)

    const onChangeOpenKeys: RowGroupingFeatureOptions['onChangeOpenKeys'] = (nextKeys, key, action) => {
      opts.onChangeOpenKeys?.(nextKeys, key, action)
      pipeline.setStateAtKey(stateKey, nextKeys, { key, action })
    }

    return pipeline
      .mapDataSource(processDataSource)
      .mapColumns(processColumns)
      .appendRowPropsGetter(rowGroupingRowPropsGetter)

    function processDataSource(input: any[]) {
      return flatMap(input, (row) => {
        let result = [attachGroupingMeta(row)]

        const expanded = openKeySet.has(row[rowKey])
        if (expanded) {
          if (Array.isArray(row.children)) {
            result = result.concat(row.children)
          }
        }

        return result
      })
    }

    function processColumns(columns: ColumnType[]) {
      if (columns.length === 0) {
        return columns
      }
      const columnFlatCount = collectNodes(columns, 'leaf-only').length
      const [firstCol, ...others] = columns

      const render = (_value: any, row: any, rowIndex: number) => {
        const content = internals.safeRender(firstCol, row, rowIndex)
        const meta = getGroupingMeta(row)
        if (!meta.isGroupHeader || !meta.expandable) {
          const marginLeft = textOffset + (meta.isGroupHeader ? 0 : indents.indentSize)
          return (
            <InlineFlexCell style={{ marginLeft }}>
              {meta.isGroupHeader ? row.groupTitle ?? content : content}
            </InlineFlexCell>
          )
        }

        const expanded = openKeySet.has(row[rowKey])
        const expandCls = expanded
          ? pipeline.getTableContext().Classes?.expanded
          : pipeline.getTableContext().Classes?.collapsed
        return (
          <ExpansionCell className={cx('expansion-cell', expandCls)}>
            <icons.CaretRight
              className={cx(pipeline.getTableContext().Classes?.expandIcon, expandCls)}
              style={{ marginLeft: indents.iconIndent, marginInlineEnd: indents.iconGap }}
            />
            {row.groupTitle ?? content}
          </ExpansionCell>
        )
      }

      const getCellProps = (value: any, row: any, rowIndex: number) => {
        const meta = getGroupingMeta(row)
        if (!meta.isGroupHeader) {
          return
        }

        const { expandable } = meta

        const currentRowKey = row[rowKey]
        const expanded = openKeySet.has(currentRowKey)

        let onClick: any
        if (expandable) {
          onClick = (e: React.MouseEvent) => {
            if (opts.stopClickEventPropagation) {
              e.stopPropagation()
            }
            if (expanded) {
              onChangeOpenKeys(
                openKeys.filter((key) => key !== currentRowKey),
                currentRowKey,
                'collapse'
              )
            } else {
              onChangeOpenKeys([...openKeys, currentRowKey], currentRowKey, 'expand')
            }
          }
        }

        const prevProps = firstCol.getCellProps?.(value, row, rowIndex)
        return mergeCellProps(prevProps, {
          onClick,
          style: { cursor: expandable ? 'pointer' : undefined },
        })
      }

      return [
        {
          ...firstCol,
          title: (
            <div style={{ display: 'inline-block', marginLeft: textOffset }}>
              {internals.safeRenderHeader(firstCol)}
            </div>
          ),
          render,
          getCellProps,
          getSpanRect(_value: any, row: any, rowIndex: number) {
            if (getGroupingMeta(row).isGroupHeader) {
              return { top: rowIndex, bottom: rowIndex + 1, left: 0, right: columnFlatCount }
            }
          },
        },
        ...others,
      ]
    }
  }
}
