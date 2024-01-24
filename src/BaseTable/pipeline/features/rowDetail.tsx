import { TriggerEventHandler } from '@table/interface'
import cx from 'classnames'
import { intersectionWith } from 'lodash-es'
import React, { Key } from 'react'

import getTableRenderTemplate from '../../base/renderTemplates'
import { ExpansionCell, InlineFlexCell } from '../../common-views'
import { ColumnType } from '../../interfaces'
import { internals } from '../../internals'
import { collectNodes, mergeCellProps, renderExpandIcon } from '../../utils'
import console from '../../utils/console'
import { always, flatMap } from '../../utils/others'
import { TablePipeline } from '../pipeline'
import { tableWidthKey } from './autoFill'

export interface RenderExpandIconProps<RecordType> extends Partial<React.StyleHTMLAttributes<HTMLElement>> {
  prefixCls: string
  expanded: boolean
  record: RecordType
  expandable: boolean
  onExpand: TriggerEventHandler<RecordType>
}

export type RenderExpandIcon<RecordType> = (props: RenderExpandIconProps<RecordType>) => JSX.Element

export type ExpandedRowRender<ValueType> = (
  record: ValueType,
  index: number,
  indent: number,
  expanded: boolean
) => React.ReactNode

export interface RowDetailFeatureOptions<RecordType = any> {
  /** 非受控用法：是否默认展开所有详情单元格 */
  defaultExpandAllRows?: boolean

  /** 非受控用法：默认展开的 keys */
  defaultExpandedRowKeys?: Key[]

  /** 受控用法：当前展开的 keys */
  expandedRowKeys?: Key[]

  /** 详情单元格的渲染方法 */
  expandedRowRender?: ExpandedRowRender<RecordType>

  /** 是否包含详情单元格 */
  rowExpandable?(row: RecordType, rowIndex?: number): boolean

  /** 获取详情单元格所在行的 key，默认为 `(row) => row[rowKey] + '_detail'` */
  getDetailKey?(row: RecordType, rowIndex: number): string

  /** 详情单元格 td 的额外样式 */
  detailCellStyle?: React.CSSProperties

  /** 点击事件的响应区域 */
  clickArea?: 'cell' | 'content' | 'icon'

  /** 是否对触发展开/收拢的 click 事件调用 event.stopPropagation() */
  stopClickEventPropagation?: boolean

  /** 指定表格每一行元信息的记录字段 */
  rowDetailMetaKey?: string | symbol

  /** 指定在哪一列设置展开按钮 */
  expandColumnDataIndex?: string

  /** 自定义展开图标 */
  expandIcon?: RenderExpandIcon<RecordType>

  /** 自定义展开列表头 */
  columnTitle?: React.ReactNode

  /** 控制展开图标是否固定 */
  fixed?: boolean

  /** 自定义展开列宽度 */
  columnWidth?: ColumnType<RecordType>['width']

  /** 点击展开图标时触发 */
  onExpand?: (expanded: boolean, record: RecordType) => void

  /** 展开的行变化时触发 */
  onExpandedRowsChange?: (expandedKeys: readonly Key[]) => void
}

const rowDetailSymbol = Symbol('row-detail')

const fallbackRenderDetail = () => (
  <div style={{ margin: '8px 24px' }}>
    <b style={{ color: 'indianred' }}>
      Set <code>[rowDetail.expandedRowRender]</code> to customize the details
    </b>
  </div>
)

export function rowDetail(opts: RowDetailFeatureOptions = {}) {
  return function rowDetailStep(pipeline: TablePipeline) {
    const stateKey = 'rowDetail'

    const rowDetailMetaKey = opts.rowDetailMetaKey ?? rowDetailSymbol

    const rowKey = pipeline.ensurePrimaryKey('rowDetail')

    const { indents } = pipeline.ctx
    const textOffset = indents.iconIndent + indents.iconWidth + indents.iconGap
    const clickArea = opts.clickArea ?? 'icon'

    const getDetailKey =
      opts.getDetailKey ?? ((row, rowIndex) => `${internals.safeGetRowKey(rowKey, row, rowIndex)}_detail`)
    const expandedRowRender = opts.expandedRowRender ?? fallbackRenderDetail
    const rowExpandable = opts.rowExpandable ?? always(true)

    const expandedRowKeys =
      opts.expandedRowKeys ??
      pipeline.getStateAtKey(stateKey) ??
      (opts.defaultExpandAllRows
        ? pipeline
            .getDataSource()
            .filter(rowExpandable)
            .map((row, rowIndex) => internals.safeGetRowKey(rowKey, row, rowIndex))
        : opts.defaultExpandedRowKeys) ??
      []
    const onExpandedRowsChange = (nextKeys: React.Key[], key: React.Key, action: string) => {
      const expandedRows = intersectionWith(
        pipeline.getDataSource(),
        nextKeys,
        (prev: { id: string }, nextv: string) => prev?.id === nextv
      )
      opts.onExpandedRowsChange?.(expandedRows)
      pipeline.setStateAtKey(stateKey, nextKeys, { key, action })
    }

    const openKeySet = new Set(expandedRowKeys)

    const toggle = (currentRowKey: Key, record: any) => {
      const expanded = openKeySet.has(currentRowKey)
      if (expanded) {
        onExpandedRowsChange(
          expandedRowKeys.filter((key) => key !== currentRowKey),
          currentRowKey,
          'collapse'
        )
      } else {
        onExpandedRowsChange([...expandedRowKeys, currentRowKey], currentRowKey, 'expand')
      }
      opts.onExpand?.(!expanded, record)
    }

    const detailPrimaryKey = typeof rowKey === 'string' ? rowKey : `${rowDetailMetaKey.toString()}RowKey`

    return pipeline
      .dataSource(
        flatMap(pipeline.getDataSource(), (row, rowIndex) => {
          const arr = [{ $dataIndex: rowIndex, ...row }]
          if (openKeySet.has(internals.safeGetRowKey(rowKey, row, rowIndex))) {
            arr.push({
              [rowDetailMetaKey]: true,
              ...row,
              $expadnIndex: rowIndex,
              $expadFlag: !!openKeySet.has(internals.safeGetRowKey(rowKey, row, rowIndex)),
              [detailPrimaryKey]: getDetailKey(row, rowIndex),
            })
          }
          return arr
        })
      )
      .columns(processColumns(pipeline.getColumns()))
      .appendRowPropsGetter((row) => {
        if (row[rowDetailMetaKey]) {
          return {
            className: cx('no-hover', pipeline.getTableContext().Classes?.isExpandContentRow),
            'data-row-detail-key': row[detailPrimaryKey],
          }
        }
      })

    function processColumns(columns: ColumnType[]) {
      if (columns.length === 0) {
        return columns
      }
      let expandColumnIndex: number
      if (opts.expandColumnDataIndex) {
        expandColumnIndex = columns.findIndex((col) => col.dataIndex === opts.expandColumnDataIndex)
        if (expandColumnIndex < 0) {
          console.warn('No expandable column found, please check the set expanded column code')
          return columns
        }
      }
      const expandCol = columns[expandColumnIndex]
      const tableColumns = [...columns]

      const render = (_value: any, row: any, rowIndex: number) => {
        const currentRowKey = internals.safeGetRowKey(rowKey, row, rowIndex)
        const expanded = openKeySet.has(currentRowKey)
        if (row[rowDetailMetaKey]) {
          let contentNode = null
          const renderRowDetail = getTableRenderTemplate('rowDetail')
          if (typeof renderRowDetail === 'function') {
            contentNode = renderRowDetail({
              row,
              rowIndex,
              domHelper: pipeline.ref.current.domHelper,
              expandedRowRender,
            })
          } else {
            contentNode = expandedRowRender(row, rowIndex, indents.iconIndent, expanded)
          }

          return (
            <div
              style={{
                // width: componentWidth - (fixHeader ? scrollbarSize : 0)
                width: pipeline.getStateAtKey(tableWidthKey) ?? '100%',
                position: 'sticky',
                left: 0,
                overflow: 'hidden',
              }}
              className={pipeline.getTableContext().Classes?.expandRowFixed}
            >
              {contentNode}
            </div>
          )
        }
        const content = expandCol ? internals.safeRender(expandCol, row, rowIndex) : null
        if (!rowExpandable(row, rowIndex)) {
          return <InlineFlexCell style={{ marginLeft: textOffset }}>{content}</InlineFlexCell>
        }

        const onClick = (e: React.MouseEvent) => {
          if (opts.stopClickEventPropagation) {
            e.stopPropagation()
          }
          toggle(currentRowKey, row)
        }

        const expandCls = expanded
          ? pipeline.getTableContext().Classes?.expanded
          : pipeline.getTableContext().Classes?.collapsed
        const ExpandIcon = opts.expandIcon
        const recordExpandable = typeof rowExpandable === 'function' ? rowExpandable(row, rowIndex) : true

        return (
          <ExpansionCell
            className={cx('expansion-cell', expandCls)}
            style={{ cursor: clickArea === 'content' ? 'pointer' : undefined }}
            onClick={clickArea === 'content' ? onClick : undefined}
          >
            {opts.expandIcon ? (
              <ExpandIcon
                expanded={expanded}
                prefixCls={pipeline.getTableContext().namespace}
                record={row}
                expandable={recordExpandable}
                onExpand={clickArea === 'icon' ? onClick : undefined}
                onClick={clickArea === 'icon' ? onClick : undefined}
              />
            ) : (
              renderExpandIcon({
                Classes: pipeline.getTableContext().Classes,
                expanded,
                expandable: recordExpandable,
                record: row,
                onExpand: clickArea === 'icon' ? onClick : undefined,
              })
            )}
            {content}
          </ExpansionCell>
        )
      }

      const onCell = (value: any, row: any, rowIndex: number) => {
        if (row[rowDetailMetaKey]) {
          return {
            style: {
              '--cell-padding': '0',
              overflow: 'hidden',
              ...opts.detailCellStyle,
            } as any,
          }
        }

        const prevProps = expandCol?.onCell?.(value, row, rowIndex)

        if (!rowExpandable(row, rowIndex)) {
          return prevProps
        }

        return mergeCellProps(prevProps, {
          onClick(e) {
            if (opts.stopClickEventPropagation) {
              e.stopPropagation()
            }
            toggle(internals.safeGetRowKey(rowKey, row, rowIndex), row)
          },
          style: { cursor: 'pointer' },
        })
      }

      const [firstCol] = tableColumns

      const firstColRender = (_value: any, row: any, rowIndex: number) => {
        if (row[rowDetailMetaKey]) {
          let contentNode = null
          const renderRowDetail = getTableRenderTemplate('rowDetail')
          if (typeof renderRowDetail === 'function') {
            contentNode = renderRowDetail({
              row,
              rowIndex,
              domHelper: pipeline.ref.current.domHelper,
              expandedRowRender,
            })
          } else {
            const currentRowKey = internals.safeGetRowKey(rowKey, row, rowIndex)
            const expanded = openKeySet.has(currentRowKey)
            contentNode = expandedRowRender(row, rowIndex, indents.iconIndent, expanded)
          }

          return (
            <div
              style={{
                width: pipeline.getStateAtKey(tableWidthKey) ?? '100%',
                position: 'sticky',
                left: 0,
                overflow: 'hidden',
              }}
              className={pipeline.getTableContext().Classes?.expandRowFixed}
            >
              {contentNode}
            </div>
          )
        }
        const content = internals.safeRender(firstCol, row, rowIndex)
        return content
      }

      const baseColumn = {
        title: opts.columnTitle,
        onCell: clickArea === 'cell' ? onCell : expandCol?.onCell,
        getSpanRect(_value: any, row: any, rowIndex: number) {
          if (row[rowDetailMetaKey]) {
            // detail 总是成一行
            return {
              top: rowIndex,
              bottom: rowIndex + 1,
              left: 0,
              right: collectNodes(pipeline.getColumns(), 'leaf-only').length,
            }
          }
        },
      }

      const detailColumn: ColumnType = {
        ...baseColumn,
        key: 'table-expand',
        align: 'center',
        width: opts.columnWidth ?? 50,
        fixed: opts.fixed,
        render,
      }
      if (expandColumnIndex !== undefined) {
        tableColumns[expandColumnIndex] = {
          ...expandCol,
          ...baseColumn,
          title: (
            <div style={{ display: 'inline-block', marginLeft: textOffset }}>
              {internals.safeRenderHeader(expandCol)}
            </div>
          ),
          render,
        }
      } else if (['table-checkbox', 'table-radio'].includes(tableColumns?.[0]?.key)) {
        const selectColumn = tableColumns.splice(0, 1, detailColumn)
        if (selectColumn?.[0]) {
          tableColumns.unshift(selectColumn?.[0])
          const newColumns = { ...baseColumn }
          delete newColumns.title
          tableColumns[0] = {
            ...firstCol,
            ...newColumns,
            onCell: tableColumns[0].onCell,
            render: firstColRender,
          }
        }
      } else {
        tableColumns.unshift(detailColumn)
      }

      return tableColumns
    }
  }
}
