import cx from 'classnames'
import { useBaseTableContext } from 'o-rc-table'
import type { CSSProperties } from 'react'
import React, { ReactNode, useCallback } from 'react'

import type { ColumnType } from '../interfaces'
import { internals } from '../internals'
import { Colgroup } from './colgroup'
import SpanManager from './helpers/SpanManager'
import { RenderInfo } from './interfaces'
import { BaseTableProps, type FixedShadowInfoType } from './table'
import { getTitleFromCellRenderChildren } from './utils'

export interface HtmlTableProps extends Required<Pick<BaseTableProps, 'onRow' | 'rowKey' | 'rowClassName'>> {
  tbodyHtmlTag: 'tbody' | 'tfoot'
  data: any[]
  stickyRightOffset?: number

  horizontalRenderInfo: Pick<
    RenderInfo,
    'flat' | 'visible' | 'horizontalRenderRange' | 'stickyLeftMap' | 'stickyRightMap'
  >

  verticalRenderInfo: {
    offset: number
    first: number
    last: number
    limit: number
  }

  tbodyPosition?: 'left' | 'center' | 'right'
  fixedShadowInfo?: FixedShadowInfoType
}

function HtmlTable({
  tbodyHtmlTag,
  onRow,
  rowKey,
  stickyRightOffset,
  data,
  verticalRenderInfo: verInfo,
  horizontalRenderInfo: hozInfo,
  tbodyPosition,
  fixedShadowInfo,
  rowClassName,
}: HtmlTableProps) {
  const { flat } = hozInfo

  const { Classes, getComponent } = useBaseTableContext()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const spanManager = new SpanManager()
  const fullFlatCount = flat.full.length
  const leftFlatCount = flat.left.length
  const rightFlatCount = flat.right.length

  // ====================== Render: Node ======================
  const TableComponent = getComponent(['table'], 'table')
  const WrapperComponent = getComponent(['body', 'wrapper'], tbodyHtmlTag)
  const TrComponent = getComponent(['body', 'row'], 'tr')
  const TdComponent = getComponent(['body', 'cell'], 'td')

  const renderBodyCell = useCallback(
    (record: any, rowIndex: number, column: ColumnType, colIndex: number, key: string) => {
      if (spanManager.testSkip(rowIndex, colIndex)) {
        return null
      }

      const value = internals.safeGetValue(column, record, rowIndex)
      const cellProps: any = column.onCell?.(value, record, rowIndex) ?? {}

      const isFixedLeft = colIndex < leftFlatCount || tbodyPosition === 'left'
      const isFixedRight = colIndex >= fullFlatCount - rightFlatCount
      const isFixedLeftLast =
        fixedShadowInfo.left && isFixedLeft && flat?.left?.[flat?.left?.length - 1]?.key === column.key
      const isFixedRightFirst =
        fixedShadowInfo.right && isFixedRight && flat?.right?.[flat?.right?.length - 1]?.key === column.key

      let cellContent: ReactNode = value
      if (column.render) {
        cellContent = column.render(value, record, record.$dataIndex ?? rowIndex)
      } else if (column.ellipsis && (isFixedLeftLast || isFixedRightFirst)) {
        cellContent = (
          <span key={column.key} className={Classes?.tableCellContent}>
            {cellContent}
          </span>
        )
      }

      let colSpan = 1
      let rowSpan = 1
      if (column.getSpanRect) {
        const spanRect = column.getSpanRect(value, record, rowIndex)
        colSpan = spanRect == null ? 1 : spanRect.right - colIndex
        rowSpan = spanRect == null ? 1 : spanRect.bottom - rowIndex
      } else {
        if (cellProps.colSpan != null) {
          colSpan = cellProps.colSpan
        }
        if (column.colSpan != null) {
          colSpan = column.colSpan
        }
        if (cellProps.rowSpan != null) {
          rowSpan = cellProps.rowSpan
        }
      }

      const hasSpan = colSpan > 1 || rowSpan > 1
      if (hasSpan) {
        spanManager.add(rowIndex, colIndex, colSpan, rowSpan)
      }

      // rowSpan/colSpan 不能过大，避免 rowSpan/colSpan 影响因虚拟滚动而未渲染的单元格
      rowSpan = Math.min(rowSpan, verInfo.limit - rowIndex)
      colSpan = Math.min(colSpan, hozInfo.visible.length - colIndex)

      // todo: 右侧有列固定的情况下colSpan计算不对，这里先限制一下
      rowSpan = Math.max(rowSpan, 1)
      colSpan = Math.max(colSpan, 1)

      const positionStyle: CSSProperties = {}

      if (colIndex < leftFlatCount) {
        positionStyle.position = 'sticky'
        positionStyle.left = hozInfo.stickyLeftMap.get(colIndex)
      } else if (colIndex >= fullFlatCount - rightFlatCount) {
        positionStyle.position = 'sticky'
        positionStyle.right =
          hozInfo.stickyRightMap.get(colIndex) +
          (tbodyHtmlTag === 'tfoot' && typeof stickyRightOffset === 'number' ? stickyRightOffset : 0)
      }

      // ============================ title =============================
      const title = getTitleFromCellRenderChildren({
        rowType: 'body',
        ellipsis: column.ellipsis,
        children: cellContent,
      })

      return React.createElement(
        TdComponent,
        {
          ...cellProps,
          key,
          className: cx(Classes?.tableCell, column.className, cellProps.className, {
            [Classes?.first]: colIndex === 0,
            [Classes?.last]: colIndex + colSpan === fullFlatCount,
            [Classes?.fixedLeft]: isFixedLeft,
            [Classes?.fixedRight]: isFixedRight,
            [Classes?.fixedLeftLast]: isFixedLeftLast,
            [Classes?.fixedRightFirst]: isFixedRightFirst,
            [Classes?.rowSpan]: rowSpan > 1,
            [Classes?.tableCellEllipsis]: column.ellipsis,
          }),
          ...(hasSpan ? { colSpan, rowSpan } : null),
          style: {
            textAlign: column.align,
            verticalAlign: column.verticalAlign ?? 'middle',
            ...cellProps.style,
            ...positionStyle,
          },
          title,
          'data-role': 'table-cell',
          'data-rowindex': rowIndex,
          'data-index': column.dataIndex,
        },
        tbodyPosition === 'center' && positionStyle.position === 'sticky' ? null : cellContent
      )
    },
    [
      spanManager,
      leftFlatCount,
      tbodyPosition,
      fullFlatCount,
      rightFlatCount,
      fixedShadowInfo.left,
      fixedShadowInfo.right,
      flat?.left,
      flat?.right,
      verInfo.limit,
      hozInfo.visible.length,
      hozInfo.stickyLeftMap,
      hozInfo.stickyRightMap,
      TdComponent,
      Classes?.tableCell,
      Classes?.first,
      Classes?.last,
      Classes?.fixedLeft,
      Classes?.fixedRight,
      Classes?.fixedLeftLast,
      Classes?.fixedRightFirst,
      Classes?.rowSpan,
      Classes?.tableCellEllipsis,
      Classes?.tableCellContent,
      tbodyHtmlTag,
      stickyRightOffset,
    ]
  )

  const renderRow = useCallback(
    (record: any, i: number) => {
      const rowIndex = verInfo.offset + i
      spanManager.stripUpwards(rowIndex)

      // ====================== RowClassName ======================
      let computeRowClassName: string
      if (typeof rowClassName === 'string') {
        computeRowClassName = rowClassName
      } else if (typeof rowClassName === 'function') {
        computeRowClassName = rowClassName(record, rowIndex)
      }

      const rowProps = onRow?.(record, rowIndex)
      const rowClass = cx(
        Classes?.tableRow,
        {
          [Classes?.first]: rowIndex === verInfo.first,
          [Classes?.last]: rowIndex === verInfo.last,
          [Classes?.odd]: rowIndex % 2 === 0,
          [Classes?.even]: rowIndex % 2 === 1,
        },
        rowProps?.className,
        computeRowClassName
      )

      const visibleColumnDescriptor = hozInfo.visible.concat()

      // 左中右区域渲染，存在融合单元格时需要适配rowspan属性
      // 如果固定的列均存在融合单元格，需空白一列做占位,否则融合的单元格不会渲染，导致显示异常
      // 这里无法区分是否存在融合列，默认左右固定区域均添加占位空白列
      if (['left', 'right'].indexOf(tbodyPosition) > -1) {
        visibleColumnDescriptor.push({ type: 'blank', blankSide: 'left', width: 0, isPlacehoder: true })
      }

      return (
        <TrComponent
          {...rowProps}
          className={rowClass}
          key={`${rowProps?.['data-row-detail-key']}^_^${internals.safeGetRowKey(rowKey, record, rowIndex)}`}
          data-rowindex={rowIndex}
          data-row-key={internals.safeGetRowKey(rowKey, record, rowIndex)}
          data-role="table-row"
        >
          {visibleColumnDescriptor.map((descriptor: Record<string, any>, index) => {
            const key = `${index}^_^${descriptor.colIndex}^_^${descriptor.col?.key}`
            if (descriptor.type === 'blank') {
              return <TdComponent key={key} style={{ visibility: descriptor.isPlacehoder ? 'hidden' : undefined }} />
            }
            return renderBodyCell(record, rowIndex, descriptor.col, descriptor.colIndex, key)
          })}
        </TrComponent>
      )
    },
    [
      Classes?.even,
      Classes?.first,
      Classes?.last,
      Classes?.odd,
      Classes?.tableRow,
      TdComponent,
      TrComponent,
      hozInfo.visible,
      onRow,
      renderBodyCell,
      rowClassName,
      rowKey,
      spanManager,
      tbodyPosition,
      verInfo.first,
      verInfo.last,
      verInfo.offset,
    ]
  )

  return (
    <TableComponent className={Classes?.tableDom}>
      <Colgroup descriptors={hozInfo.visible} />
      {React.createElement(
        WrapperComponent,
        { className: Classes?.tableBodyTbody },
        data.map((item, index) => renderRow(item, index))
      )}
    </TableComponent>
  )
}

export default React.memo(HtmlTable)
