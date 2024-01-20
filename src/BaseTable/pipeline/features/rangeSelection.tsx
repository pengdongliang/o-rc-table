import cx from 'classnames'
import React from 'react'
import { fromEvent } from 'rxjs'
import { map, takeUntil } from 'rxjs/operators'

import { CellProps, ColumnType } from '../../interfaces'
import { collectNodes, isElementInEventPath, makeRecursiveMapper, mergeCellProps } from '../../utils'
import { findByTree } from '../../utils/others'
import { TablePipeline } from '../pipeline'

export interface RangeSelectionFeatureOptions {
  /** 范围选中回调函数 */
  rangeSelectedChange?(cellRanges: CellRange[], isFinished: boolean): void
  /** 是否阻止keydown的默认行为 */
  preventkDefaultOfKeyDownEvent?: boolean
  /** 是否禁止多范围框选 */
  suppressMultiRangeSelection?: boolean
}

interface DragCell {
  rowIndex: number
  rowSpan: number
  dataIndex: string
  column: ColumnType
  isFooterCell: boolean
}

interface FooterRowRange {
  startRow: number
  endRow: number
}

interface CellRange {
  startRow: number
  endRow: number
  columns: ColumnType[]
  startColumn: ColumnType
  footerRowRange: FooterRowRange | null
}
export const rangeSelectionKey = 'rangeSelection'
export const lastClickCellKey = 'lastClickCell'

const startSelectedCellRangesKey = 'startSelectedCellRanges'
const SCROLL_OFFSET = 30

export function rangeSelection(opts: RangeSelectionFeatureOptions) {
  return function step(pipeline: TablePipeline) {
    const tableBody = pipeline.ref.current.domHelper && pipeline.ref.current.domHelper.tableBody
    const tableFooter = pipeline.ref.current.domHelper && pipeline.ref.current.domHelper.tableFooter
    const artTable = pipeline.ref.current.domHelper && pipeline.ref.current.domHelper.artTable
    if (!tableBody) {
      return pipeline
    }

    const columns = pipeline.getColumns()
    const dataSource = pipeline.getDataSource()
    const rangeSelectedChange = (range: CellRange[], isFinished: boolean) => {
      if (isFinished) {
        pipeline.setFeatureOptions(startSelectedCellRangesKey, range)
      }
      pipeline.setStateAtKey(rangeSelectionKey, range)
      opts?.rangeSelectedChange?.(range, isFinished)
    }

    const setRangeSelection = (startDragCell: DragCell, draggingCell: DragCell, isFinished: boolean) => {
      if (!startDragCell || !draggingCell) return
      const rangeColumns = getRangeColumns(startDragCell, draggingCell, columns)
      const { startRow, endRow, footerRowRange } = getRangeSelectionRowInfo(startDragCell, draggingCell, dataSource)
      const cellRange = {
        startRow,
        endRow,
        columns: rangeColumns,
        startColumn: startDragCell.column,
        footerRowRange,
      }

      let cellRanges = pipeline.getFeatureOptions(startSelectedCellRangesKey)
        ? [...pipeline.getFeatureOptions(startSelectedCellRangesKey)]
        : []
      if (isCellRangeSingleCell([cellRange])) {
        const singleCellRangeId = getCellRangeId(cellRange)
        cellRanges = cellRanges.filter((item) => getCellRangeId(item) !== singleCellRangeId)
      }
      cellRanges.push(cellRange)
      if (isCellRangeSingleCell(cellRanges)) {
        artTable.classList.remove(cx(pipeline.getTableContext().Classes?.rangeSelection))
      } else {
        artTable.classList.add(cx(pipeline.getTableContext().Classes?.rangeSelection))
      }
      rangeSelectedChange(cellRanges, isFinished)
    }

    const shiftKeySelect = (event: React.MouseEvent<HTMLTableElement, MouseEvent>) => {
      const { target } = event
      const clickCell = getTargetCell(target, columns, pipeline)
      if (clickCell) {
        const _lastClickCell = pipeline.getFeatureOptions(lastClickCellKey)
        if (_lastClickCell) {
          setRangeSelection(_lastClickCell, clickCell, true)
        } else {
          // 第一次进来就按住shift键，这时候要记住点击的单元格
          pipeline.setFeatureOptions(lastClickCellKey, clickCell)
        }
      }
    }

    const updateScrollPosition = (client: { clientX: any; clientY: any }) => {
      const { clientX, clientY } = client
      const tableBodyClientRect = tableBody.getBoundingClientRect()

      const { left, top, height, width } = tableBodyClientRect

      if (clientX + SCROLL_OFFSET >= left + width) {
        pipeline.ref.current.domHelper.virtual.scrollLeft += SCROLL_OFFSET
      }
      if (clientX - SCROLL_OFFSET <= left) {
        pipeline.ref.current.domHelper.virtual.scrollLeft -= SCROLL_OFFSET
      }
      if (clientY + SCROLL_OFFSET >= top + height) {
        pipeline.ref.current.domHelper.tableBody.scrollTop += SCROLL_OFFSET
      }
      if (clientY + SCROLL_OFFSET <= top) {
        pipeline.ref.current.domHelper.tableBody.scrollTop -= SCROLL_OFFSET
      }
    }

    const setStartSelectedCellRanges = (isCtrlKey: boolean, isShiftKey: boolean) => {
      if (opts?.suppressMultiRangeSelection) {
        pipeline.setFeatureOptions(startSelectedCellRangesKey, [])
        return
      }
      // ctrl 和shift 同时按时，优先生效shift
      // 没有点击ctrl 或者shift时，每次点击开始时都清空选中范围
      if (!isCtrlKey && !isShiftKey) {
        pipeline.setFeatureOptions(startSelectedCellRangesKey, [])
      }

      // shift 点击框选，要保留之前的选中结果。最新的框选范围覆盖最后一次的框选范围
      if (isShiftKey) {
        const _startDragCellRanges = pipeline.getFeatureOptions(startSelectedCellRangesKey)
          ? [...pipeline.getFeatureOptions(startSelectedCellRangesKey)]
          : []
        _startDragCellRanges.pop()
        pipeline.setFeatureOptions(startSelectedCellRangesKey, _startDragCellRanges)
      }
    }

    const onMouseDown = (mouseDownEvent: React.MouseEvent<HTMLTableElement, MouseEvent>) => {
      if (
        mouseDownEvent.button !== 0 ||
        !(
          isElementInEventPath(tableBody, mouseDownEvent.nativeEvent) ||
          isElementInEventPath(tableFooter, mouseDownEvent.nativeEvent)
        )
      )
        return
      // mouseDownEvent.preventDefault()

      const isCtrlKey = mouseDownEvent.ctrlKey || mouseDownEvent.metaKey
      const isShiftKey = mouseDownEvent.shiftKey
      const { target } = mouseDownEvent

      // 每次点击时先确认初始生效的框选范围
      setStartSelectedCellRanges(isCtrlKey, isShiftKey)

      if (isShiftKey) {
        shiftKeySelect(mouseDownEvent)
        return
      }

      const startDragCell = getTargetCell(target, columns, pipeline)
      pipeline.setFeatureOptions(lastClickCellKey, startDragCell)
      let draggingCell = startDragCell

      const mousemove$ = fromEvent<MouseEvent>(window, 'mousemove')
      const mouseup$ = fromEvent<MouseEvent>(window, 'mouseup')

      const rangeSelected$ = mousemove$.pipe(
        map((mouseMoveEvent: MouseEvent) => {
          const tar = mouseMoveEvent.target || mouseMoveEvent.srcElement
          draggingCell = getTargetCell(tar, columns, pipeline)
          const client = {
            clientX: mouseMoveEvent.clientX,
            clientY: mouseMoveEvent.clientY,
          }
          if (!draggingCell?.isFooterCell) {
            updateScrollPosition(client)
          }

          return {
            startDragCell,
            draggingCell,
          }
        }),
        takeUntil(mouseup$)
      )

      rangeSelected$.subscribe({
        next: ({ startDragCell: c, draggingCell: d }) => {
          setRangeSelection(c, d, false)
        },
        complete() {
          setRangeSelection(startDragCell, draggingCell, true)
        },
      })
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLTableElement>) => {
      if (!(isElementInEventPath(tableBody, e.nativeEvent) || isElementInEventPath(tableFooter, e.nativeEvent))) return

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        const rowLen = pipeline.getDataSource().length
        const footerDataSource = pipeline.getFooterDataSource() || []
        // 焦点位于可编辑的单元格内不做全选
        if (columns.length && rowLen && !getElementEditable(e.target)) {
          opts.preventkDefaultOfKeyDownEvent !== false && e.preventDefault()
          artTable.classList.add(cx(pipeline.getTableContext().Classes?.rangeSelection))
          rangeSelectedChange(
            [
              {
                startRow: 0,
                endRow: rowLen - 1,
                columns: collectNodes(columns, 'leaf-only'),
                startColumn: columns[0],
                footerRowRange:
                  footerDataSource.length > 0 ? { startRow: 0, endRow: footerDataSource.length - 1 } : null,
              },
            ],
            true
          )
        }
      }
    }

    pipeline.addTableProps({
      onMouseDown,
      onKeyDown,
      tabIndex: -1,
      className: cx([pipeline.getTableContext().Classes?.rangeSelection]),
    }) // todo: 后面可以把mousedown放到一个流里面

    return pipeline.mapColumns(
      makeRecursiveMapper((col) => {
        const cellRanges = pipeline.getStateAtKey(rangeSelectionKey) || []

        const prevGetCellProps = col.onCell
        return {
          ...col,
          onCell(value: any, record: any, rowIndex: number): CellProps {
            const prevCellProps = prevGetCellProps?.(value, record, rowIndex)
            const isFooterCell = record[pipeline.getFeatureOptions('footerRowMetaKey')]
            if (!cellRanges.some((cellRange: any) => isCellInRange(cellRange, rowIndex, col, isFooterCell)))
              return prevCellProps
            const className = getCellRangesClassName(cellRanges, { isFooterCell, rowIndex, col }, pipeline)
            return mergeCellProps(prevCellProps, {
              className,
            })
          },
        }
      })
    )
  }
}

function getTargetCell(target: any, columns: ColumnType[], pipeline: TablePipeline): DragCell {
  while (target) {
    if (target.getAttribute('data-role') === 'table-cell') {
      const columnCode = target.getAttribute('data-index')
      const column = findByTree(columns, (item) => item.dataIndex === columnCode)
      if (!column) return null
      return {
        rowIndex: parseInt(target.getAttribute('data-rowindex'), 10),
        rowSpan: parseInt(target.getAttribute('rowspan') || 1, 10),
        dataIndex: columnCode,
        column,
        isFooterCell: isEleInFooter(target, pipeline),
      }
    }
    target = target.parentElement
  }
  return null
}

function isSameCell(cell1: DragCell, cell2: DragCell) {
  return (
    cell1.rowIndex === cell2.rowIndex &&
    cell1.dataIndex === cell2.dataIndex &&
    cell1.isFooterCell === cell2.isFooterCell
  )
}

function isEleInFooter(
  target: { classList: { contains: (arg0: any) => any }; parentElement: any },
  pipeline: TablePipeline
) {
  while (target && !target.classList.contains(pipeline.getTableContext().Classes?.artTable)) {
    if (target.classList.contains(pipeline.getTableContext().Classes?.tableFooter)) {
      return true
    }
    target = target.parentElement
  }
  return false
}

function getRangeColumns(startCell: DragCell, endCell: DragCell, columns: ColumnType[]) {
  const flatColumns = collectNodes(columns, 'leaf-only')
  const startIndex = flatColumns.findIndex((col) => col.dataIndex === startCell.dataIndex)
  const endIndex = flatColumns.findIndex((col) => col.dataIndex === endCell.dataIndex)
  if (startIndex < endIndex) {
    return flatColumns.slice(startIndex, endIndex + 1)
  }
  return flatColumns.slice(endIndex, startIndex + 1)
}

function getRangeSelectionRowInfo(startCell: DragCell, endCell: DragCell, dataSource: any[]) {
  let footerRowRange = null
  let startRow = -1
  let endRow = -1
  const { startRow: _startRow, endRow: _endRow } = getCellRangeRow(startCell, endCell)
  // 两个单元格都在表体
  if (!startCell.isFooterCell && !endCell.isFooterCell) {
    startRow = _startRow
    endRow = _endRow
  } else if (startCell.isFooterCell && endCell.isFooterCell) {
    // 两个单元格都在表底
    footerRowRange = {
      startRow: _startRow,
      endRow: _endRow,
    }
  } else {
    // 一个单元格在表体，一个在表底
    // eslint-disable-next-line no-lonely-if
    if (startCell.isFooterCell) {
      startRow = dataSource.length - 1
      endRow = endCell.rowIndex
      footerRowRange = {
        startRow: startCell.rowIndex,
        endRow: 0,
      }
    } else {
      startRow = startCell.rowIndex
      endRow = dataSource.length - 1
      footerRowRange = {
        startRow: 0,
        endRow: endCell.rowIndex,
      }
    }
  }

  return {
    startRow,
    endRow,
    footerRowRange,
  }
}

/**
 * 获取框选范围的起始结束行
 * @param startCell 起始单元格
 * @param endCell 结束单元格
 * @returns
 */
function getCellRangeRow(startCell: DragCell, endCell: DragCell) {
  if (isSameCell(startCell, endCell)) {
    return { startRow: startCell.rowIndex, endRow: startCell.rowIndex }
  }
  const isTopToBottom = startCell.rowIndex <= endCell.rowIndex
  const startRow = isTopToBottom ? startCell.rowIndex : startCell.rowIndex + startCell.rowSpan - 1
  const endRow = isTopToBottom ? endCell.rowIndex + endCell.rowSpan - 1 : endCell.rowIndex
  return { startRow, endRow }
}

/**
 * 框选范围是否只包含单个单元格
 * @param cellRanges
 * @returns
 */
function isCellRangeSingleCell(cellRanges: CellRange[]) {
  if (cellRanges.length !== 1) return false
  const { startRow, endRow, columns, footerRowRange } = cellRanges[0]
  const isBodySingleCell = !footerRowRange && startRow === endRow && columns.length === 1
  const isFooterSingleCell =
    startRow === -1 && footerRowRange.startRow === footerRowRange.endRow && columns.length === 1

  return isBodySingleCell || isFooterSingleCell
}

function getRowIndex(startRow: number, endRow: number) {
  const isReverse = startRow > endRow
  const startRowIndex = isReverse ? endRow : startRow
  const endRowIndex = isReverse ? startRow : endRow
  return { startRowIndex, endRowIndex }
}

function getFooterRowIndex(footerRowRange: FooterRowRange) {
  if (footerRowRange) {
    return getRowIndex(footerRowRange.startRow, footerRowRange.endRow)
  }
  return { startRowIndex: -1, endRowIndex: -1 }
}

function getElementEditable(target: any) {
  if (!target) return
  if (['input', 'textarea'].includes(target.tagName.toLowerCase())) {
    if (target.type === 'checkbox') return
    return !target.disabled && !target.readOnly
  }
}

/**
 * 判断单元格是否在框选范围内
 * @param cellRange
 * @param rowIndex
 * @param col
 * @param isFooterCell
 * @returns
 */
function isCellInRange(
  cellRange: { startRow: any; endRow: any; columns: any; footerRowRange: any },
  rowIndex: number,
  col: ColumnType,
  isFooterCell: any
) {
  const { startRow, endRow, columns, footerRowRange } = cellRange
  const isColInRanges = columns.findIndex((item: Record<string, any>) => item.dataIndex === col.dataIndex) !== -1
  if (!isColInRanges) return false
  const { startRowIndex, endRowIndex } = getRowIndex(startRow, endRow)
  const { startRowIndex: footerStartRowIndex, endRowIndex: footerEndRowIndex } = getFooterRowIndex(footerRowRange)
  const bodyMatch = !isFooterCell && rowIndex >= startRowIndex && rowIndex <= endRowIndex
  const footerMatch = isFooterCell && footerRowRange && rowIndex >= footerStartRowIndex && rowIndex <= footerEndRowIndex
  const isRowInRange = footerMatch || bodyMatch
  return isRowInRange
}

/**
 * 获取框选范围唯一标识
 * @param {*} cellRange
 * @returns
 */
export function getCellRangeId(cellRange: CellRange) {
  const { startRow, endRow, footerRowRange, columns } = cellRange
  const { startRowIndex, endRowIndex } = getRowIndex(startRow, endRow)
  const { startRowIndex: footerStartRowIndex, endRowIndex: footerEndRowIndex } = getFooterRowIndex(footerRowRange)
  const firstColId = columns[0].dataIndex
  const endColId = columns[columns.length - 1].dataIndex
  return `${startRowIndex}_${endRowIndex}_${footerStartRowIndex}_${footerEndRowIndex}_${firstColId}_${endColId}`
}

/**
 * 获取框选范围中单元格的样式
 * @param cellRanges
 * @param param1
 * @returns
 */
function getCellRangesClassName(cellRanges: any, { isFooterCell, rowIndex, col }, pipeline: TablePipeline) {
  const { matchCellRangeTop, matchCellRangeLeft, matchCellRangeBottom, matchCellRangeRight } = getMatchBorderStyle(
    cellRanges,
    { isFooterCell, rowIndex, col }
  )

  const isSingleCell = isCellRangeSingleCell(cellRanges)
  const className = cx({
    [pipeline.getTableContext().Classes?.tableCellRangeSingleCell]: isSingleCell,
    [pipeline.getTableContext().Classes?.tableCellRangeSelected]: !isSingleCell,
    [pipeline.getTableContext().Classes?.tableCellRangeTop]: !isSingleCell && matchCellRangeTop,
    [pipeline.getTableContext().Classes?.tableCellRangeLeft]: !isSingleCell && matchCellRangeLeft,
    [pipeline.getTableContext().Classes?.tableCellRangeBottom]: !isSingleCell && matchCellRangeBottom,
    [pipeline.getTableContext().Classes?.tableCellRangeRight]: !isSingleCell && matchCellRangeRight,
  })

  return className
}

function getMatchBorderStyle(cellRanges: any, { isFooterCell, rowIndex, col }) {
  return cellRanges.reduce(
    (obj: Record<string, any>, cellRange: { startRow: any; endRow: any; columns: any; footerRowRange: any }) => {
      if (!isCellInRange(cellRange, rowIndex, col, isFooterCell)) return obj
      const { startRow, endRow, columns, footerRowRange } = cellRange
      const { startRowIndex, endRowIndex } = getRowIndex(startRow, endRow)

      const { startRowIndex: footerStartRowIndex, endRowIndex: footerEndRowIndex } = getFooterRowIndex(footerRowRange)
      const startCol = columns[0]
      const endCol = columns[columns.length - 1]

      const matchCellRangeTop = isFooterCell
        ? startRowIndex !== -1
          ? false
          : rowIndex === footerStartRowIndex
        : rowIndex === startRowIndex
      const matchCellRangeLeft = col.dataIndex === startCol.dataIndex
      const matchCellRangeBottom = isFooterCell
        ? rowIndex === footerEndRowIndex
        : footerRowRange
        ? false
        : rowIndex === endRowIndex
      const matchCellRangeRight = col.dataIndex === endCol.dataIndex

      // 如果样式已经匹配上了，就不需要再取计算的样式
      obj.matchCellRangeTop ||= matchCellRangeTop
      obj.matchCellRangeLeft ||= matchCellRangeLeft
      obj.matchCellRangeBottom ||= matchCellRangeBottom
      obj.matchCellRangeRight ||= matchCellRangeRight

      return obj
    },
    {
      matchCellRangeTop: false,
      matchCellRangeLeft: false,
      matchCellRangeBottom: false,
      matchCellRangeRight: false,
    }
  )
}
