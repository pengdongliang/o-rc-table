import styled from '@emotion/styled'
import classnames from 'classnames'
import React from 'react'
import { fromEvent } from 'rxjs'
import * as op from 'rxjs/operators'

import { ColumnType } from '../../interfaces'
import { internals } from '../../internals'
import { collectNodes, isGroupColumn, makeRecursiveMapper, mergeCellProps } from '../../utils'
import { TablePipeline } from '../pipeline'

const TableHeaderCellResize = styled.div`
  position: absolute;
  top: 0;
  right: -5px;
  height: 100%;
  width: 10px;
  cursor: col-resize;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;

  &:after {
    content: '';
    position: absolute;
    display: block;
    left: 50%;
    width: 1px;
    height: 60%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  &:hover,
  &.${({ theme }) => theme?.Classes?.tableHeaderCellResizeDragging} {
    scale: 1.2;
    &:after {
      background-color: #333 !important;
    }
  }
`

const TableHeaderGroupCellResize = styled((props: any) => <TableHeaderCellResize {...props} />)`
  &:after {
    height: 100%;
  }
`

interface ColumnSize {
  [key: string]: number
}

interface ChangedColumnSize {
  dataIndex: string
  width: number
}

export interface ColumnResizeOptions {
  columnSize?: ColumnSize
  /** 列的最小宽度，默认为 60 */
  minSize?: number
  /** 如果列宽数组中没有提供有效的宽度，fallbackSize 将作为该列的宽度，默认为 150 */
  fallbackSize?: number
  /** 列的最大宽度，默认为 1000 */
  maxSize?: number

  doubleClickCallback?(e: React.MouseEvent<HTMLSpanElement>, col: ColumnType): void

  onChangeSize?(nextSize: ColumnSize): void
  afterChangeSize?(nextSize: ColumnSize, changedColumnSize: ChangedColumnSize[]): void
}

function clamp(min: number, x: number, max: number) {
  return Math.max(min, Math.min(max, x))
}

function disableSelect(event: Event) {
  event.preventDefault()
}

const stateKey = 'columnResize'
const RESIZE_BAR_KEY = 'resizeBarKey'
export const COLUMN_SIZE_KEY = 'columnResize'
export const RESIZED_COLUMN_KEY = 'resizedColumn'
export const LAST_RESIZED_COLUMN_KEY = 'lastResizedColumn'

export function columnResize(opts: ColumnResizeOptions = {}) {
  const minSize = opts.minSize ?? 60
  const fallbackSize = opts.fallbackSize ?? 150
  const maxSize = opts.maxSize ?? 1000
  return function columnResizeFeature(pipeline: TablePipeline) {
    const columnSize: ColumnSize = opts.columnSize ?? pipeline.getStateAtKey(stateKey) ?? {}
    const resizeBarSize: ColumnSize = pipeline.getStateAtKey(RESIZE_BAR_KEY) ?? {}

    const leafColumns = collectNodes(pipeline.getColumns(), 'leaf-only')
    leafColumns.forEach(({ dataIndex, width }) => {
      if (columnSize[dataIndex] === undefined) {
        if (typeof width === 'number') {
          columnSize[dataIndex] = width
        } else {
          columnSize[dataIndex] = fallbackSize
        }
      }
    })

    // 实时存储一份最新的columnSize，与autoFill共用一份数据
    // 存在state里可能存到取不到最新的
    pipeline.setFeatureOptions(COLUMN_SIZE_KEY, columnSize)

    const onChangeSize = (nextColumnSize: ColumnSize, dataIndex: string) => {
      window.requestAnimationFrame(() => {
        pipeline.setStateAtKey(stateKey, nextColumnSize)
        pipeline.setStateAtKey(RESIZE_BAR_KEY, { [dataIndex]: 0 })
        opts?.onChangeSize?.(nextColumnSize)
      })
    }

    const onChangeDragBarSize = (nextColumnSize: ColumnSize) => {
      window.requestAnimationFrame(() => {
        pipeline.setStateAtKey(RESIZE_BAR_KEY, nextColumnSize)
      })
    }

    const handleDoubleClick = (e: React.MouseEvent<HTMLSpanElement>, col: ColumnType) => {
      opts.doubleClickCallback?.(e, col)
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLSpanElement>, col: ColumnType) => {
      window.addEventListener('selectstart', disableSelect)
      const changedColumnSize = {}
      const startX = e.clientX
      const { children, dataIndex, features = {} } = col
      const { minWidth, maxWidth } = features
      const realMinSize = typeof minWidth === 'number' ? minWidth : minSize
      const realMaxSize = typeof maxWidth === 'number' ? maxWidth : maxSize
      const tempColumnSize = pipeline.getFeatureOptions(COLUMN_SIZE_KEY)
      const nextColumnSize = { ...tempColumnSize }
      let recordColumnSize = tempColumnSize
      e.stopPropagation()
      const nextSize$ = fromEvent<MouseEvent>(window, 'mousemove').pipe(
        op.takeUntil(fromEvent(window, 'mouseup')),
        op.map((event) => {
          const movingX = event.clientX
          const deltaSum = movingX - startX
          let deltaRemaining = deltaSum
          if (children?.length > 0) {
            const leafChildColumns = collectNodes(children, 'leaf-only')
            const childrenWidthSum = leafChildColumns.reduce((sum, { dataIndex: sumDataIndex }) => {
              return sum + tempColumnSize[sumDataIndex]
            }, 0)
            leafChildColumns.forEach(({ dataIndex: leafDataIndex }, index) => {
              const startSize = tempColumnSize[leafDataIndex]
              const currentDeltaWidth = Math.round((deltaSum * startSize) / childrenWidthSum)
              if (index < leafChildColumns.length - 1) {
                nextColumnSize[leafDataIndex] = clamp(realMinSize, startSize + currentDeltaWidth, realMaxSize)
                changedColumnSize[leafDataIndex] = nextColumnSize[leafDataIndex]
                deltaRemaining -= currentDeltaWidth
              } else {
                nextColumnSize[leafDataIndex] = clamp(realMinSize, startSize + deltaRemaining, realMaxSize)
                changedColumnSize[leafDataIndex] = nextColumnSize[leafDataIndex]
              }
            })
          } else {
            const startSize = tempColumnSize[dataIndex]
            nextColumnSize[dataIndex] = clamp(realMinSize, startSize + deltaSum, realMaxSize)
            changedColumnSize[dataIndex] = nextColumnSize[dataIndex]
          }
          recordColumnSize = nextColumnSize
          return nextColumnSize
        })
      )

      nextSize$.subscribe({
        next: (nextSize) => {
          onChangeDragBarSize(nextSize)
          // 由于COLUMN_RESIZE_KEY记录的是全量的列宽，此处记录被改变过的列宽
          const resizedColumnSet = pipeline.getFeatureOptions(RESIZED_COLUMN_KEY) || new Set()
          Object.keys(changedColumnSize).forEach((resizedDataIndex) => {
            resizedColumnSet.add(resizedDataIndex, changedColumnSize[resizedDataIndex])
          })
          pipeline.setFeatureOptions(RESIZED_COLUMN_KEY, resizedColumnSet)
          pipeline.setFeatureOptions(LAST_RESIZED_COLUMN_KEY, dataIndex)
        },
        complete() {
          onChangeSize(nextColumnSize, dataIndex)
          const changedColumnSizes = Object.keys(changedColumnSize).map((changedDataIndex) => {
            return { dataIndex: changedDataIndex, width: changedColumnSize[changedDataIndex] }
          })
          window.requestAnimationFrame(() => {
            opts?.afterChangeSize?.(recordColumnSize, changedColumnSizes)
          })
          window.removeEventListener('selectstart', disableSelect)
        },
      })
    }

    const isGroup = isGroupColumn(pipeline.getColumns())

    return pipeline.mapColumns(
      makeRecursiveMapper((col, { isLast }) => {
        const prevTitle = internals.safeRenderHeader(col)
        const { dataIndex, features, width } = col
        const finalWidth = columnSize[dataIndex] ?? width
        const dragging = resizeBarSize[dataIndex]
        const positionRight = `${(dragging ? (finalWidth as number) - (dragging ?? 0) : 0) - 5}px`

        return {
          ...col,
          width: finalWidth,
          title: (
            <>
              {prevTitle}
              {features?.resizeable !== false &&
                (isGroup ? (
                  <TableHeaderGroupCellResize
                    className={classnames({
                      [pipeline.getTableContext().Classes?.tableHeaderCellResize]: !isLast,
                    })}
                    onDoubleClick={(e: React.MouseEvent<HTMLSpanElement>) => handleDoubleClick(e, col)}
                    onMouseDown={(e: React.MouseEvent<HTMLSpanElement>) => handleMouseDown(e, col)}
                    style={{ right: positionRight }}
                  />
                ) : (
                  <TableHeaderCellResize
                    className={classnames({
                      [pipeline.getTableContext().Classes?.tableHeaderCellResize]: !isLast,
                      [pipeline.getTableContext().Classes?.tableHeaderCellResizeDragging]: positionRight !== '-5px',
                    })}
                    onDoubleClick={(e: React.MouseEvent<HTMLSpanElement>) => handleDoubleClick(e, col)}
                    onMouseDown={(e: React.MouseEvent<HTMLSpanElement>) => handleMouseDown(e, col)}
                    style={{ right: positionRight }}
                  />
                ))}
            </>
          ),
          onHeaderCell: () =>
            mergeCellProps(col.onHeaderCell?.(col), {
              className: 'resizeable',
            }),
        }
      })
    )
  }
}
