/* eslint-disable */
import React from 'react'
import { noop } from 'rxjs'

import { Table, type TableProps, type TableRef } from '../../base'
import { CellProps } from '../../interfaces'
import { CrossTableLeftMetaColumn, LeftCrossTreeNode, ROW_KEY, TopCrossTreeNode } from '../cross-table'
import buildCrossTreeTable from './buildCrossTreeTable'

export interface CrossTreeTableProps extends Omit<TableProps, 'dataSource' | 'columns' | 'rowKey'> {
  BaseTableComponent?: any
  baseTableRef?: React.Ref<TableRef>
  primaryColumn: CrossTableLeftMetaColumn
  leftTree: LeftCrossTreeNode[]
  topTree: TopCrossTreeNode[]

  defaultOpenKeys?: string[]
  openKeys?: string[]
  onChangeOpenKeys?(nextOpenKeys: string[]): void
  indentSize?: number
  isLeafNode?(node: any, nodeMeta: { depth: number; expanded: boolean; currentRowKey: string }): boolean

  getValue(leftNode: LeftCrossTreeNode, topNode: TopCrossTreeNode, leftDepth: number, topDepth: number): any
  render?(
    value: any,
    leftNode: LeftCrossTreeNode,
    topNode: TopCrossTreeNode,
    leftDepth: number,
    topDepth: number
  ): React.ReactNode
  onCell?(
    value: any,
    leftNode: LeftCrossTreeNode,
    topNode: TopCrossTreeNode,
    leftDepth: number,
    topDepth: number
  ): CellProps
}

export default class CrossTreeTable extends React.Component<CrossTreeTableProps, { openKeys: string[] }> {
  static defaultProps = {
    defaultOpenKeys: [] as string[],
    onChangeOpenKeys: noop,
  }

  static getDerivedStateFromProps(nextProps: Readonly<CrossTreeTableProps>) {
    if ('openKeys' in nextProps) {
      return { openKeys: nextProps.openKeys }
    }
    return null
  }

  constructor(props: Readonly<CrossTreeTableProps>) {
    super(props)
    this.state = {
      openKeys: props.defaultOpenKeys,
    }
  }

  onChangeOpenKeys = (nextOpenKeys: string[]) => {
    this.props.onChangeOpenKeys(nextOpenKeys)
    if (!('openKeys' in this.props)) {
      this.setState({ openKeys: nextOpenKeys })
    }
  }

  render() {
    const {
      BaseTableComponent = Table,
      leftTree,
      topTree,
      getValue,
      onCell,
      primaryColumn,
      render,

      openKeys: openKeysProp,
      defaultOpenKeys,
      onChangeOpenKeys,
      indentSize,
      isLeafNode,
      baseTableRef,

      ...others // 透传其他 BaseTable 的 props
    } = this.props

    const openKeys = openKeysProp ?? this.state.openKeys

    const { dataSource, columns } = buildCrossTreeTable({
      leftTree,
      topTree,
      getValue,
      onCell,
      render,
      primaryColumn,

      openKeys,
      onChangeOpenKeys: this.onChangeOpenKeys,
      indentSize,
      isLeafNode,
    })

    return (
      <BaseTableComponent
        ref={baseTableRef}
        {...others}
        rowKey={ROW_KEY}
        dataSource={dataSource}
        columns={columns}
      />
    )
  }
}
