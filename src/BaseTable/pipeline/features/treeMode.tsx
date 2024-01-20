import cx from 'classnames'
import React from 'react'

import { ExpansionCell, InlineFlexCell } from '../../common-views'
import { ColumnType } from '../../interfaces'
import { internals } from '../../internals'
import { isLeafNode as standardIsLeafNode, mergeCellProps, renderExpandIcon } from '../../utils'
import { TablePipeline } from '../pipeline'

export const treeMetaSymbol = Symbol('treeMetaSymbol')

interface ExpandIconProps extends React.DOMAttributes<Element> {
  expanded: boolean
  style: React.CSSProperties
  className?: string
}

export interface TreeModeFeatureOptions {
  /** 非受控用法：默认展开的 keys */
  defaultOpenKeys?: string[]

  /** 受控用法：当前展开的 keys */
  openKeys?: string[]

  /** 受控用法：展开 keys 改变的回调 */
  onChangeOpenKeys?(nextKeys: string[], key: string, action: 'expand' | 'collapse'): void

  /** 自定义叶子节点的判定逻辑 */
  isLeafNode?(node: any, nodeMeta: { depth: number; expanded: boolean; currentRowKey: string }): boolean

  /** 展开折叠图标 */
  icon?(props: ExpandIconProps): JSX.Element

  /** icon 的缩进值。一般为负数，此时 icon 将向左偏移，默认从 pipeline.ctx.indents 中获取 */
  iconIndent?: number

  /** icon 与右侧文本的距离，默认从 pipeline.ctx.indents 中获取 */
  iconGap?: number

  /** 每一级缩进产生的距离，默认从 pipeline.ctx.indents 中获取 */
  indentSize?: number

  /** 点击事件的响应区域 */
  clickArea?: 'cell' | 'content' | 'icon'

  /** 是否对触发展开/收拢的 click 事件调用 event.stopPropagation() */
  stopClickEventPropagation?: boolean

  /** 指定表格每一行元信息的记录字段 */
  treeMetaKey?: string | symbol

  /** 指定展开列 */
  expandColCode?: string
}

export function treeMode(opts: TreeModeFeatureOptions = {}) {
  return function treeModeStep(pipeline: TablePipeline) {
    const stateKey = 'treeMode'
    const { ctx } = pipeline

    const rowKey = pipeline.ensurePrimaryKey('treeMode')

    const openKeys: string[] = opts.openKeys ?? pipeline.getStateAtKey(stateKey) ?? opts.defaultOpenKeys ?? []
    const openKeySet = new Set(openKeys)
    const onChangeOpenKeys: TreeModeFeatureOptions['onChangeOpenKeys'] = (nextKeys: string[], key, action) => {
      opts.onChangeOpenKeys?.(nextKeys, key, action)
      pipeline.setStateAtKey(stateKey, nextKeys, { key, action })
    }

    const toggle = (currentRowKey: string) => {
      const expanded = openKeySet.has(currentRowKey)
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
    const isLeafNode = opts.isLeafNode ?? standardIsLeafNode
    const clickArea = opts.clickArea ?? 'icon'
    const treeMetaKey = opts.treeMetaKey ?? treeMetaSymbol
    const stopClickEventPropagation = Boolean(opts.stopClickEventPropagation)

    // indents
    const { iconWidth } = ctx.indents
    const iconIndent = opts.iconIndent ?? ctx.indents.iconIndent
    const iconGap = opts.iconGap ?? ctx.indents.iconGap
    const indentSize = opts.indentSize ?? ctx.indents.indentSize

    const Icon = opts.icon

    return pipeline.mapDataSource(processDataSource).mapColumns(processColumns)

    function processDataSource(input: any[]) {
      if (!Array.isArray(input?.[0]?.children)) return input ?? []
      const result: any[] = []
      dfs(input, 0)

      function dfs(nodes: any[], depth: number) {
        if (nodes == null) {
          return
        }
        for (const node of nodes) {
          const currentRowKey = internals.safeGetRowKey(rowKey, node, -1)
          const expanded = openKeySet.has(currentRowKey)

          const isLeaf = isLeafNode(node, { depth, expanded, currentRowKey })
          const treeMeta = { depth, isLeaf, expanded, currentRowKey }
          result.push({ [treeMetaKey]: treeMeta, ...node })

          if (!isLeaf && expanded) {
            dfs(node.children, depth + 1)
          }
        }
      }
      return result
    }

    function processColumns(columns: ColumnType[]) {
      if (columns.length === 0) {
        return columns
      }

      let expandColIndex = columns.findIndex(({ dataIndex }) => dataIndex && opts.expandColCode === dataIndex)
      expandColIndex = expandColIndex === -1 ? 0 : expandColIndex
      const expandCol = columns[expandColIndex]

      const render = (_value: any, record: any, recordIndex: number) => {
        const content = internals.safeRender(expandCol, record, recordIndex)
        if (record[treeMetaKey] == null) {
          // 没有 treeMeta 信息的话，就返回原先的渲染结果
          return content
        }

        const { currentRowKey, depth, isLeaf, expanded } = record[treeMetaKey]

        const indent = iconIndent + depth * indentSize

        if (isLeaf) {
          return (
            <InlineFlexCell className={cx('expansion-cell', pipeline.getTableContext().Classes?.leaf)}>
              <span style={{ marginLeft: indent + iconWidth + iconGap }}>{content}</span>
            </InlineFlexCell>
          )
        }

        const onClick = (e: React.MouseEvent) => {
          if (stopClickEventPropagation) {
            e.stopPropagation()
          }
          toggle(currentRowKey)
        }
        const expandCls = expanded
          ? pipeline.getTableContext().Classes?.expanded
          : pipeline.getTableContext().Classes?.collapsed

        return (
          <ExpansionCell
            className={cx('expansion-cell', expandCls)}
            style={{
              cursor: clickArea === 'content' ? 'pointer' : undefined,
              justifyContent: 'unset',
            }}
            onClick={clickArea === 'content' ? onClick : undefined}
          >
            {Icon ? (
              <Icon
                expanded={expanded}
                className={cx(pipeline.getTableContext().Classes?.expandIcon, expandCls)}
                style={{
                  cursor: clickArea === 'icon' ? 'pointer' : undefined,
                  marginLeft: indent,
                  marginInlineEnd: iconGap,
                }}
                onClick={clickArea === 'icon' ? onClick : undefined}
                aria-expanded={expanded}
              />
            ) : (
              renderExpandIcon({
                Classes: pipeline.getTableContext().Classes,
                expanded,
                expandable: true,
                record,
                onExpand: clickArea === 'icon' ? onClick : undefined,
                style: {
                  cursor: clickArea === 'icon' ? 'pointer' : undefined,
                  marginLeft: indent,
                  marginInlineEnd: iconGap,
                },
              })
            )}
            {content}
          </ExpansionCell>
        )
      }

      const onCell = (_value: any, record: any, rowIndex: number) => {
        const prevProps = internals.safeGetCellProps(expandCol, record, rowIndex)
        if (record[treeMetaKey] == null) {
          // 没有 treeMeta 信息的话，就返回原先的 cellProps
          return prevProps
        }

        const { isLeaf, currentRowKey } = record[treeMetaKey]
        if (isLeaf) {
          return prevProps
        }

        return mergeCellProps(prevProps, {
          onClick(e) {
            if (stopClickEventPropagation) {
              e.stopPropagation()
            }
            toggle(currentRowKey)
          },
          style: { cursor: 'pointer' },
        })
      }

      columns[expandColIndex] = {
        ...expandCol,
        title: internals.safeRenderHeader(expandCol),
        render,
        onCell: clickArea === 'cell' ? onCell : expandCol.onCell,
      }

      return [...columns]
    }
  }
}
