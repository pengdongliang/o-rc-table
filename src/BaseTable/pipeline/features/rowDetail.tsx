import cx from 'classnames'
import React, { ReactNode } from 'react'

import { Classes } from '../../base'
import getTableRenderTemplate from '../../base/renderTemplates'
import { ExpansionCell, icons, InlineFlexCell } from '../../common-views'
import { ArtColumn } from '../../interfaces'
import { internals } from '../../internals'
import { collectNodes, mergeCellProps } from '../../utils'
import console from '../../utils/console'
import { always, flatMap } from '../../utils/others'
import { TablePipeline } from '../pipeline'

interface expandIconProps extends React.SVGProps<SVGElement> {
  expanded: boolean
}
export interface RowDetailFeatureOptions {
  /** 非受控用法：是否默认展开所有详情单元格 */
  defaultOpenAll?: boolean

  /** 非受控用法：默认展开的 keys */
  defaultOpenKeys?: string[]

  /** 受控用法：当前展开的 keys */
  openKeys?: string[]

  /** 受控用法：openKeys 改变的回调 */
  onChangeOpenKeys?(nextKeys: string[], key: string, action: 'expand' | 'collapse'): void

  /** 详情单元格的渲染方法 */
  renderDetail?(row: any, rowIndex: number): ReactNode

  /** 是否包含详情单元格 */
  hasDetail?(row: any, rowIndex: number): ReactNode

  /** 获取详情单元格所在行的 key，默认为 `(row) => row[rowKey] + '_detail'` */
  getDetailKey?(row: any, rowIndex: number): string

  /** 详情单元格 td 的额外样式 */
  detailCellStyle?: React.CSSProperties

  /** 点击事件的响应区域 */
  clickArea?: 'cell' | 'content' | 'icon'

  /** 是否对触发展开/收拢的 click 事件调用 event.stopPropagation() */
  stopClickEventPropagation?: boolean

  /** 指定表格每一行元信息的记录字段 */
  rowDetailMetaKey?: string | symbol

  /** 指定在哪一列设置展开按钮 */
  expandColumnCode?: string

  /** 自定义展开图标 */
  expandIcon?: (props: expandIconProps) => JSX.Element
}

const rowDetailSymbol = Symbol('row-detail')

const fallbackRenderDetail = () => (
  <div style={{ margin: '8px 24px' }}>
    <b style={{ color: 'indianred' }}>
      设置 <code>rowDetail.renderDetail</code> 来自定义详情内容
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
    const clickArea = opts.clickArea ?? 'cell'

    const getDetailKey =
      opts.getDetailKey ?? ((row, rowIndex) => `${internals.safeGetRowKey(rowKey, row, rowIndex)}_detail`)
    const renderDetail = opts.renderDetail ?? fallbackRenderDetail
    const hasDetail = opts.hasDetail ?? always(true)

    const openKeys: string[] =
      opts.openKeys ??
      pipeline.getStateAtKey(stateKey) ??
      (opts.defaultOpenAll
        ? pipeline
            .getDataSource()
            .filter(hasDetail)
            .map((row, rowIndex) => internals.safeGetRowKey(rowKey, row, rowIndex))
        : opts.defaultOpenKeys) ??
      []
    const onChangeOpenKeys: RowDetailFeatureOptions['onChangeOpenKeys'] = (nextKeys, key, action) => {
      opts.onChangeOpenKeys?.(nextKeys, key, action)
      pipeline.setStateAtKey(stateKey, nextKeys, { key, action })
    }

    const openKeySet = new Set(openKeys)

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
    const detailPrimaryKey = typeof rowKey === 'string' ? rowKey : `${rowDetailMetaKey.toString()}RowKey`
    return pipeline
      .dataSource(
        flatMap(pipeline.getDataSource(), (row, rowIndex) => {
          if (openKeySet.has(internals.safeGetRowKey(rowKey, row, rowIndex))) {
            return [row, { [rowDetailMetaKey]: true, ...row, [detailPrimaryKey]: getDetailKey(row, rowIndex) }]
          }
          return [row]
        })
      )
      .columns(processColumns(pipeline.getColumns()))
      .appendRowPropsGetter((row) => {
        if (row[rowDetailMetaKey]) {
          return { className: 'no-hover', 'data-row-detail-key': row[detailPrimaryKey] }
        }
      })

    function processColumns(columns: ArtColumn[]) {
      if (columns.length === 0) {
        return columns
      }
      let expandColumnIndex = 0
      if (opts.expandColumnCode) {
        expandColumnIndex = columns.findIndex((col) => col.dataIndex === opts.expandColumnCode)
        if (expandColumnIndex < 0) {
          console.warn('没找到可展开的列，请检查设置的展开列code')
          return columns
        }
      }
      const expandCol = columns[expandColumnIndex]
      const tableColumns = [...columns]

      const render = (value: any, row: any, rowIndex: number) => {
        if (row[rowDetailMetaKey]) {
          // 第一列内容已经渲染
          if (expandColumnIndex !== 0) return
          const renderRowDetail = getTableRenderTemplate('rowDetail')
          if (typeof renderRowDetail === 'function') {
            return renderRowDetail({ row, rowIndex, domHelper: pipeline.ref.current.domHelper, renderDetail })
          }
          return renderDetail(row, rowIndex)
        }

        const content = internals.safeRender(expandCol, row, rowIndex)

        if (!hasDetail(row, rowIndex)) {
          return <InlineFlexCell style={{ marginLeft: textOffset }}>{content}</InlineFlexCell>
        }

        const currentRowKey = internals.safeGetRowKey(rowKey, row, rowIndex)
        const expanded = openKeySet.has(currentRowKey)
        const onClick = (e: React.MouseEvent) => {
          if (opts.stopClickEventPropagation) {
            e.stopPropagation()
          }
          toggle(currentRowKey)
        }

        const expandCls = expanded ? Classes.expanded : Classes.collapsed
        const ExpandIcon = opts.expandIcon
        return (
          <ExpansionCell
            className={cx('expansion-cell', expandCls)}
            style={{ cursor: clickArea === 'content' ? 'pointer' : undefined }}
            onClick={clickArea === 'content' ? onClick : undefined}
          >
            {opts.expandIcon ? (
              <ExpandIcon expanded={expanded} onClick={clickArea === 'icon' ? onClick : undefined} />
            ) : (
              <icons.CaretRight
                style={{
                  cursor: clickArea === 'icon' ? 'pointer' : undefined,
                  marginLeft: indents.iconIndent,
                  marginRight: indents.iconGap,
                }}
                className={cx('expansion-icon', expandCls)}
                onClick={clickArea === 'icon' ? onClick : undefined}
              />
            )}
            {content}
          </ExpansionCell>
        )
      }

      const getCellProps = (value: any, row: any, rowIndex: number) => {
        if (row[rowDetailMetaKey]) {
          return {
            style: {
              '--cell-padding': '0',
              overflow: 'hidden',
              ...opts.detailCellStyle,
            } as any,
          }
        }

        const prevProps = expandCol.getCellProps?.(value, row, rowIndex)

        if (!hasDetail(row, rowIndex)) {
          return prevProps
        }

        return mergeCellProps(prevProps, {
          onClick(e) {
            if (opts.stopClickEventPropagation) {
              e.stopPropagation()
            }
            toggle(internals.safeGetRowKey(rowKey, row, rowIndex))
          },
          style: { cursor: 'pointer' },
        })
      }

      const [firstCol] = tableColumns
      const firstColRender = (_value: any, row: any, rowIndex: number) => {
        if (row[rowDetailMetaKey]) {
          const renderRowDetail = getTableRenderTemplate('rowDetail')
          if (typeof renderRowDetail === 'function') {
            return renderRowDetail({ row, rowIndex, domHelper: pipeline.ref.current.domHelper, renderDetail })
          }
          return renderDetail(row, rowIndex)
        }
        const content = internals.safeRender(firstCol, row, rowIndex)
        return content
      }

      tableColumns[0] = {
        ...firstCol,
        render: firstColRender,
        getSpanRect(value: any, row: any, rowIndex: number) {
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

      tableColumns[expandColumnIndex] = {
        ...expandCol,
        title: (
          <div style={{ display: 'inline-block', marginLeft: textOffset }}>{internals.safeRenderHeader(expandCol)}</div>
        ),
        render,
        getCellProps: clickArea === 'cell' ? getCellProps : expandCol.getCellProps,
        getSpanRect(value: any, row: any, rowIndex: number) {
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
      return tableColumns
    }
  }
}
