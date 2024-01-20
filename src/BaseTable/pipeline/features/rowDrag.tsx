import cx from 'classnames'
import React from 'react'
import { fromEvent } from 'rxjs'
import { map, takeUntil } from 'rxjs/operators'

import { CellProps, ColumnType } from '../../interfaces'
import { TablePipeline } from '../pipeline'

interface RowDragEvent {
  startRowIndex: number
  startRow: any // 起始的拖拽行
  endRowIndex: number
  endRow: any // 结束的拖拽行
  isFinished: boolean // 是否拖拽完成
  dragPosition: string // bottom | top 拖拽行基于目标行的位置
}

export interface RowDragFeatureOptions {
  /** 拖拽开始事件 */
  onDragStart?: (event: RowDragEvent) => void

  /** 拖拽移动事件 */
  onDragMove?: (event: RowDragEvent) => void

  /** 拖拽结束事件 */
  onDragEnd?: (event: RowDragEvent) => void

  /** 判断一行是否要禁用拖拽 */
  isDisabled?: (row: any, rowIndex: number) => boolean

  /** 拖拽列定义 */
  rowDragColumn?: ColumnType

  /** 行高 */
  rowHeight?: number

  /** 拖拽过程中是否禁止滚动条滚动 */
  suppressScrollMove?: boolean
}

export const ROW_DRAG_COLUMN_CODE = '$_row_drag_column_&'
export const rowDragKey = 'rowDragKey'
const SCROLL_OFFSET = 30

const defaultRowDragColumn = (pipeline: TablePipeline): ColumnType => {
  return {
    name: '拖拽列',
    dataIndex: ROW_DRAG_COLUMN_CODE,
    fixed: true,
    title: '',
    width: 40,
    align: 'center',
    onCell(): CellProps {
      return {
        className: cx(pipeline.getTableContext().Classes?.rowDragCell),
      }
    },
    render() {
      return (
        <svg
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/1999/xlink"
          data-icon="drag"
          width="16"
          height="16"
        >
          <path
            d="M298.688 192a64 64 0 1 0 128 0 64 64 0 0 0-128 0z m298.624 0a64 64 0 1 0 128 0 64 64 0 0 0-128 0zM298.688 512a64 64 0 1 0 128 0 64 64 0 0 0-128 0z m298.624 0a64 64 0 1 0 128 0 64 64 0 0 0-128 0z m-298.624 320a64 64 0 1 0 128 0 64 64 0 0 0-128 0z m298.624 0a64 64 0 1 0 128 0 64 64 0 0 0-128 0z"
            // eslint-disable-next-line react/no-unknown-property
            p-id="4278"
          />
        </svg>
      )
    },
  }
}

export function rowDrag(opt: RowDragFeatureOptions) {
  return function rowDragStep(pipeline: TablePipeline) {
    const tableBody = pipeline.ref.current.domHelper && pipeline.ref.current.domHelper.tableBody
    const artTable = pipeline.ref.current.domHelper && pipeline.ref.current.domHelper.artTable

    if (!tableBody) return pipeline

    const dataSource = pipeline.getDataSource()
    const rowHeight = opt?.rowHeight || 48

    const handleDragStrat = (event: RowDragEvent) => {
      // 开始拖拽
      artTable.classList.add(cx(pipeline.getTableContext().Classes?.rowDragging))
      opt?.onDragStart?.(event)
    }

    const handleDragMove = (event: RowDragEvent) => {
      opt?.onDragMove?.(event)

      pipeline.setStateAtKey(rowDragKey, event)
    }

    const handleDragEnd = (event: RowDragEvent, isOutOfRange: boolean) => {
      artTable.classList.remove(cx(pipeline.getTableContext().Classes?.rowDragging))
      pipeline.setStateAtKey(rowDragKey, event)
      // 超出拖拽范围不触发dragend事件
      if (!isOutOfRange) {
        opt?.onDragEnd?.(event)
      }
    }

    const getDragEvent = (
      startRowInfo: { rowIndex: any; row: any; dataIndex?: any; cell?: any },
      endRowInfo: {
        rowIndex: any
        row: any
        dataIndex?: any
        cell?: any
      },
      { isFinished, dragPosition = 'bottom' }: { isFinished: boolean; dragPosition: string }
    ) => {
      return {
        startRowIndex: startRowInfo.rowIndex,
        startRow: startRowInfo.row,
        endRowIndex: endRowInfo.rowIndex,
        endRow: endRowInfo.row,
        dragPosition,
        isFinished,
      }
    }

    const updateScrollPosition = (mouseMoveEvent: MouseEvent) => {
      if (opt?.suppressScrollMove) return
      const { clientY } = mouseMoveEvent
      const tableBodyClientRect = tableBody.getBoundingClientRect()

      const { top, height } = tableBodyClientRect

      if (clientY + SCROLL_OFFSET >= top + height) {
        pipeline.ref.current.domHelper.tableBody.scrollTop += SCROLL_OFFSET
      }
      if (clientY + SCROLL_OFFSET <= top) {
        pipeline.ref.current.domHelper.tableBody.scrollTop -= SCROLL_OFFSET
      }
    }

    const onMouseDown = (mouseDownEvent: React.MouseEvent<HTMLTableElement, MouseEvent>) => {
      const startRowInfo = getTargetRowInfo(mouseDownEvent.target, tableBody, dataSource, pipeline)
      let endRowInfo = startRowInfo

      if (!startRowInfo || startRowInfo.dataIndex !== rowDragColumn.dataIndex) return

      if (opt?.isDisabled?.(startRowInfo.row, startRowInfo.rowIndex)) return

      // 默认拖拽插入的位置是向下
      let dragPosition = 'bottom'
      let isOutOfRange = false

      const dragStartEvent = getDragEvent(startRowInfo, endRowInfo, { isFinished: false, dragPosition: 'bottom' })
      handleDragStrat(dragStartEvent)
      const tableWidth = tableBody.clientWidth
      const startRowRects = startRowInfo.cell.getBoundingClientRect()
      // 光标位置距离初始拖拽行的偏移量
      const startOffset = mouseDownEvent.clientY - startRowRects.y
      const dragElement = createDragElement(startRowRects, tableWidth, rowHeight, pipeline)
      // 可拖拽的范围
      const dragRange = getDragRange(tableBody, { startOffset, rowHeight: startRowRects.height })

      const mousemove$ = fromEvent<MouseEvent>(window, 'mousemove')
      const mouseup$ = fromEvent<MouseEvent>(window, 'mouseup')

      const rowDrag$ = mousemove$.pipe(
        map((mouseMoveEvent: MouseEvent) => {
          const { clientX, clientY } = mouseMoveEvent
          const tagretRow = getTargetRowInfo(mouseMoveEvent.target, tableBody, dataSource, pipeline)
          if (tagretRow) {
            endRowInfo = tagretRow
          }

          const targetRowRects = endRowInfo.cell.getBoundingClientRect()

          // 判断拖拽插入的位置，拖拽框上边框位于目标行之上则向上插入，否则向下插入
          const isMoveToTop = clientY - startOffset < targetRowRects.y

          dragPosition = isMoveToTop ? 'top' : 'bottom'
          isOutOfRange = isOutOfDragRange({ x: clientX, y: clientY }, dragRange)

          updateScrollPosition(mouseMoveEvent) // 拖拽到底时让滚动条可以滚动
          updateDragElementPosition(dragElement, dragRange, { x: clientX, y: clientY, startOffset })
          updateCurSorStyle(isOutOfRange)

          return { startRowInfo, endRowInfo, dragPosition }
        }),
        takeUntil(mouseup$)
      )

      rowDrag$.subscribe({
        next: ({ startRowInfo: s, endRowInfo: e, dragPosition: d }) => {
          const dragMoveEvent = getDragEvent(s, e, { isFinished: false, dragPosition: d })
          handleDragMove(dragMoveEvent)
        },
        complete() {
          const dragEndEvent = getDragEvent(startRowInfo, endRowInfo, { isFinished: true, dragPosition })
          handleDragEnd(dragEndEvent, isOutOfRange)

          removeDragElement(dragElement)
          removeCurSorStyle()
        },
      })
    }

    const rowDragColumn = opt?.rowDragColumn || defaultRowDragColumn(pipeline)
    pipeline.setFeatureOptions('rowDragColumnKey', rowDragColumn.dataIndex)

    const nextColumns = pipeline.getColumns().slice()
    nextColumns.unshift(rowDragColumn)
    pipeline.columns(nextColumns)

    pipeline.addTableProps({ onMouseDown })
    pipeline.appendRowPropsGetter((row, rowIndex) => {
      const rowDragEvent = pipeline.getStateAtKey(rowDragKey) || {}
      const { startRowIndex, endRowIndex, isFinished, dragPosition } = rowDragEvent

      const isFooterCell = row[pipeline.getFeatureOptions('footerRowMetaKey')]

      if (isFooterCell || isFinished || (rowIndex !== startRowIndex && rowIndex !== endRowIndex)) return

      const className = cx({
        [pipeline.getTableContext().Classes?.rowDragStart]: rowIndex === startRowIndex,
        [pipeline.getTableContext().Classes?.rowDragEnd]: rowIndex === endRowIndex,
        [pipeline.getTableContext().Classes?.rowDragEndToTop]: rowIndex === endRowIndex && dragPosition === 'top',
        [pipeline.getTableContext().Classes?.rowDragEndToBottom]: rowIndex === endRowIndex && dragPosition === 'bottom',
      })

      return { className }
    })

    return pipeline
  }
}

function getTargetRowInfo(
  target: any,
  tableBody: { contains: (arg0: any) => any },
  record: any[],
  pipeline: TablePipeline
) {
  while (target && tableBody.contains(target)) {
    if (target.getAttribute('data-role') === 'table-cell') {
      const dataIndex = target.getAttribute('data-index')
      const rowIndex = parseInt(target.getAttribute('data-rowindex'), 10)
      const row = record[rowIndex]
      const isFooterCell = isEleInFooter(target, pipeline)

      if (!row || isFooterCell) return null
      return {
        rowIndex,
        row,
        dataIndex,
        cell: target,
      }
    }
    target = target.parentElement
  }
  return null
}

function isEleInFooter(target: any, pipeline: TablePipeline) {
  while (target && !target.classList.contains(pipeline.getTableContext().Classes?.artTable)) {
    if (target.classList.contains(pipeline.getTableContext().Classes?.tableFooter)) {
      return true
    }
    target = target.parentElement
  }
  return false
}

function createDragElement(rects: { x: any; y: any }, tableWidth: any, rowHeight: number, pipeline: TablePipeline) {
  const { x, y } = rects

  const dragMoveElement = document.createElement('div')
  dragMoveElement.className = cx(pipeline.getTableContext().Classes?.rowDragElement)
  dragMoveElement.style.cssText = `position:fixed;z-index:9999;left:${x}px;top:${y}px;pointer-events:none;width:${tableWidth}px;height:${rowHeight}px;background:var(--primary-color);opacity: 0.1;`

  document.body.appendChild(dragMoveElement)

  return dragMoveElement
}

function updateDragElementPosition(
  element: HTMLDivElement,
  dragRange: {
    minX: any
    maxX: any
    minY: any
    maxY: any
  },
  { x, y, startOffset }: { x: number; y: number; startOffset: number }
) {
  const validPosition = getValidPosition({ x, y }, dragRange)
  element.style.top = `${validPosition.y - startOffset}px`

  return element
}

function removeDragElement(element: HTMLDivElement) {
  document.body.removeChild(element)
}

function updateCurSorStyle(isOutOfRange: boolean) {
  if (isOutOfRange) {
    document.body.style.cursor = 'no-drop'
  } else {
    document.body.style.cursor = 'move'
  }
}

function removeCurSorStyle() {
  document.body.style.cursor = 'default'
}

function getDragRange(
  tableBody: { getBoundingClientRect: () => any },
  { startOffset, rowHeight }: { startOffset: number; rowHeight: any }
) {
  const tableBodyClientRect = tableBody.getBoundingClientRect()
  const { height, width, x, y } = tableBodyClientRect
  return {
    minX: x,
    maxX: x + width,
    minY: y - rowHeight + startOffset,
    maxY: y + height + startOffset,
  }
}

function getValidPosition(position: { x: any; y: any }, dragRange: { minX: any; maxX: any; minY: any; maxY: any }) {
  const { x, y } = position
  const { minX, maxX, minY, maxY } = dragRange

  const newX = x < minX ? minX : x > maxX ? maxX : x
  const newY = y < minY ? minY : y > maxY ? maxY : y
  return {
    x: newX,
    y: newY,
  }
}

function isOutOfDragRange(position: { x: any; y: any }, dragRange: { minX: any; maxX: any; minY: any; maxY: any }) {
  const { x, y } = position
  const { minX, maxX, minY, maxY } = dragRange

  return x > maxX || x < minX || y > maxY || y < minY
}
