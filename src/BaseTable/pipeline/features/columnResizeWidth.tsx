/* eslint-disable */
import React from 'react'
import { fromEvent } from 'rxjs'
import * as op from 'rxjs/operators'
import styled from '@emotion/styled'

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
`

const TableHeaderGroupCellResize = styled((props) => <TableHeaderCellResize {...props} />)`
  &:after {
    height: 100%;
    top: 0;
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

function disableSelect(event) {
  event.preventDefault()
}

const stateKey = 'columnResize'
export const COLUMN_SIZE_KEY = 'columnResize'
export const RESIZED_COLUMN_KEY = 'resizedColumn'
export const LAST_RESIZED_COLUMN_KEY = 'lastResizedColumn'

export function columnResize(opts: ColumnResizeOptions = {}) {
  const minSize = opts.minSize ?? 60
  const fallbackSize = opts.fallbackSize ?? 150
  const maxSize = opts.maxSize ?? 1000
  return function columnResizeFeature(pipeline: TablePipeline) {
    const columnSize: ColumnSize = opts.columnSize ?? pipeline.getStateAtKey(stateKey) ?? {}
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

    const onChangeSize = (nextColumnSize: ColumnSize) => {
      window.requestAnimationFrame(() => {
        pipeline.setStateAtKey(stateKey, nextColumnSize)
        opts?.onChangeSize?.(nextColumnSize)
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
      const columnSize = pipeline.getFeatureOptions(COLUMN_SIZE_KEY)
      let recordColumnSize = columnSize
      e.stopPropagation()
      const nextSize$ = fromEvent<MouseEvent>(window, 'mousemove').pipe(
        op.takeUntil(fromEvent(window, 'mouseup')),
        op.map((e) => {
          const movingX = e.clientX
          const nextColumnSize = { ...columnSize }
          const deltaSum = movingX - startX
          let deltaRemaining = deltaSum
          if (children?.length > 0) {
            const leafChildColumns = collectNodes(children, 'leaf-only')
            const childrenWidthSum = leafChildColumns.reduce((sum, { dataIndex }) => {
              return sum + columnSize[dataIndex]
            }, 0)
            leafChildColumns.forEach(({ dataIndex }, index) => {
              const startSize = columnSize[dataIndex]
              const currentDeltaWidth = Math.round((deltaSum * startSize) / childrenWidthSum)
              if (index < leafChildColumns.length - 1) {
                nextColumnSize[dataIndex] = clamp(realMinSize, startSize + currentDeltaWidth, realMaxSize)
                changedColumnSize[dataIndex] = nextColumnSize[dataIndex]
                deltaRemaining -= currentDeltaWidth
              } else {
                nextColumnSize[dataIndex] = clamp(realMinSize, startSize + deltaRemaining, realMaxSize)
                changedColumnSize[dataIndex] = nextColumnSize[dataIndex]
              }
            })
          } else {
            const startSize = columnSize[dataIndex]
            nextColumnSize[dataIndex] = clamp(realMinSize, startSize + deltaSum, realMaxSize)
            changedColumnSize[dataIndex] = nextColumnSize[dataIndex]
          }
          recordColumnSize = nextColumnSize
          return nextColumnSize
        }),
      )

      nextSize$.subscribe({
        next: (nextColumnSize) => {
          onChangeSize(nextColumnSize)
          // 由于COLUMN_RESIZE_KEY记录的是全量的列宽，此处记录被改变过的列宽
          const resizedColumnSet = pipeline.getFeatureOptions(RESIZED_COLUMN_KEY) || new Set()
          Object.keys(changedColumnSize).forEach((dataIndex) => {
            resizedColumnSet.add(dataIndex, changedColumnSize[dataIndex])
          })
          pipeline.setFeatureOptions(RESIZED_COLUMN_KEY, resizedColumnSet)
          pipeline.setFeatureOptions(LAST_RESIZED_COLUMN_KEY, dataIndex)
        },
        complete() {
          const changedColumnSizes = Object.keys(changedColumnSize).map((dataIndex) => {
            return { dataIndex, width: changedColumnSize[dataIndex] }
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
      makeRecursiveMapper((col) => {
        const prevTitle = internals.safeRenderHeader(col)
        const { dataIndex, features, width } = col
        return {
          ...col,
          width: columnSize[dataIndex] ?? width,
          title: (
            <>
              {prevTitle}
              {features?.resizeable !== false &&
                (isGroup ? (
                  <TableHeaderGroupCellResize
                    className={pipeline.getTableContext().Classes?.tableHeaderCellResize}
                    onDoubleClick={(e: React.MouseEvent<HTMLSpanElement>) => handleDoubleClick(e, col)}
                    onMouseDown={(e: React.MouseEvent<HTMLSpanElement>) => handleMouseDown(e, col)}
                  />
                ) : (
                  <TableHeaderCellResize
                    className={pipeline.getTableContext().Classes?.tableHeaderCellResize}
                    onDoubleClick={(e: React.MouseEvent<HTMLSpanElement>) => handleDoubleClick(e, col)}
                    onMouseDown={(e: React.MouseEvent<HTMLSpanElement>) => handleMouseDown(e, col)}
                  />
                ))}
            </>
          ),
          onHeaderCell: ()=> mergeCellProps(col.onHeaderCell?.(col), {
            className: 'resizeable',
          }),
        }
      }),
    )
  }
}
