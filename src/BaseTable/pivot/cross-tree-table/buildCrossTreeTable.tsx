import { noop } from 'rxjs'

import { TableProps } from '../../base'
import { ColumnType } from '../../interfaces'
import { features, TablePipeline } from '../../pipeline'
import { isLeafNode as standardIsLeafNode } from '../../utils'
import {
  BuildCrossTableOptions,
  CrossTableLeftMetaColumn,
  LeftCrossTreeNode,
  ROW_KEY,
  TopCrossTreeNode,
} from '../cross-table'

interface CrossTreeTableRenderRow {
  [ROW_KEY]: string
  node: LeftCrossTreeNode
  nodes: LeftCrossTreeNode[]
  children?: CrossTreeTableRenderRow[]
}

export type BuildCrossTreeTableOptions = Omit<
  BuildCrossTableOptions,
  'leftMetaColumns' | 'leftTotalNode' | 'topTotalNode'
> & {
  primaryColumn: CrossTableLeftMetaColumn
  openKeys: string[]
  onChangeOpenKeys(nextOpenKeys: string[]): void
  indentSize?: number
  isLeafNode?(node: any, nodeMeta: { depth: number; expanded: boolean; currentRowKey: string }): boolean
}

export default function buildCrossTreeTable(
  options: BuildCrossTreeTableOptions
): Pick<TableProps, 'columns' | 'dataSource'> {
  const {
    primaryColumn,
    openKeys,
    onChangeOpenKeys,
    indentSize,
    isLeafNode: isLeafNodeOpt = standardIsLeafNode,
  } = options

  // 有的时候 leftTree/topTree 是通过 node.children 传入的
  // 此时 leftTree/topTree 等于 null 和等于空数组是等价的
  // 故在这里兼容 leftTree/topTree 为空的情况
  const leftTree = options.leftTree ?? []
  const topTree = options.topTree ?? []

  const pipeline = new TablePipeline({
    state: {},
    setState: noop,
    ctx: { rowKey: ROW_KEY },
  })

  pipeline.input({ dataSource: getDataSource(), columns: getColumns() })
  pipeline.use(
    features.treeMode({
      openKeys,
      onChangeOpenKeys,
      indentSize,
      isLeafNode(row: CrossTreeTableRenderRow, nodeMeta) {
        // 调用上层 isLeafNodeOpt 时，会从 row.node 中读取该表格行对应的 leftTreeNode
        return isLeafNodeOpt(row.node, nodeMeta)
      },
    })
  )

  return {
    dataSource: pipeline.getDataSource(),
    columns: pipeline.getColumns(),
  }

  /** 获取表格的列配置 */
  function getColumns(): ColumnType[] {
    return [
      {
        ...primaryColumn,
        getValue(row: CrossTreeTableRenderRow) {
          return row.node.value
        },
        onCell(value: any, row: any) {
          if (primaryColumn.onCell) {
            return primaryColumn.onCell(row.node, row.nodes.length - 1)
          }
        },
        render(value: any, row: any) {
          if (primaryColumn.render) {
            return primaryColumn.render(row.node, row.nodes.length - 1)
          }
          return value
        },
      },
      ...getDataPartColumns(),
    ]

    /** 获取表格数据部分的列配置 */
    function getDataPartColumns() {
      return dfs(topTree, { depth: 0 })

      function dfs(nodes: TopCrossTreeNode[], ctx: { depth: number }): ColumnType[] {
        const result: ColumnType[] = []

        for (const node of nodes) {
          if (standardIsLeafNode(node)) {
            result.push(getDataColumn(node, ctx.depth))
          } else {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars,unused-imports/no-unused-vars
            const { key, value, children, ...others } = node
            result.push({
              ...others,
              name: value,
              children: dfs(children, { depth: ctx.depth + 1 }),
            })
          }
        }

        return result
      }
    }

    function getDataColumn(topNode: TopCrossTreeNode, topDepth: number): ColumnType {
      const columnGetValue = (row: CrossTreeTableRenderRow) => {
        const leftDepth = row.nodes.length - 1
        const leftNode = row.node
        return options.getValue(leftNode, topNode, leftDepth, topDepth)
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars,unused-imports/no-unused-vars
      const { key, value, children, ...others } = topNode
      return {
        ...others,
        getValue: columnGetValue,
        name: value,
        children: null,
        render(val: any, row: CrossTreeTableRenderRow) {
          if (options.render) {
            const leftDepth = row.nodes.length - 1
            const leftNode = row.node
            return options.render(val, leftNode, topNode, leftDepth, topDepth)
          }
          return val
        },
        onCell(val, row: CrossTreeTableRenderRow) {
          if (options.onCell) {
            const leftDepth = row.nodes.length - 1
            const leftNode = row.node
            return options.onCell(val, leftNode, topNode, leftDepth, topDepth)
          }
        },
      }
    }
  }

  function getDataSource(): CrossTreeTableRenderRow[] {
    return dfs(leftTree, { nodes: [] })

    function dfs(nodes: LeftCrossTreeNode[], ctx: { nodes: LeftCrossTreeNode[] }): CrossTreeTableRenderRow[] {
      const result: CrossTreeTableRenderRow[] = []

      for (const node of nodes) {
        if (node.hidden) {
          // 跳过被隐藏的节点
          continue
        }

        if (standardIsLeafNode(node)) {
          result.push({
            [ROW_KEY]: node.key,
            node,
            nodes: [...ctx.nodes, node],
          })
        } else {
          const items = [...ctx.nodes, node]
          ctx.nodes.push(node)
          const children = dfs(node.children, ctx)
          result.push({ [ROW_KEY]: node.key, node, nodes: items, children })
          ctx.nodes.pop()
        }
      }

      return result
    }
  }
}
