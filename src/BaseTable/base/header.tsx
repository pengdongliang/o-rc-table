import cx from 'classnames'
import { useBaseTableContext } from 'o-rc-table'
import { getTitleFromCellRenderChildren } from 'o-rc-table/base/utils'
import type { CSSProperties } from 'react'

import type { ColumnType } from '../interfaces'
import { getTreeDepth, isLeafNode } from '../utils'
import { HorizontalRenderRange, RenderInfo } from './interfaces'

function range(n: number) {
  const array: number[] = []
  for (let i = 0; i < n; i++) {
    array.push(i)
  }
  return array
}

type ColWithRenderInfo =
  | {
      type: 'normal'
      colIndex: number
      col: ColumnType
      colSpan: number
      isLeaf: boolean
      width: number
    }
  | { type: 'blank'; blankSide: 'left' | 'right'; width: number; isPlacehoder?: boolean }

type IndexedCol = {
  colIndex: number
  col: ColumnType
  children?: IndexedCol[]
}

/** 根据当前横向虚拟滚动 对 nested.center 进行过滤，结果只保留当前视野内可见的那些列配置 */
function filterNestedCenter(centerNested: ColumnType[], hoz: HorizontalRenderRange, leftFlatCount: number) {
  return dfs(centerNested, leftFlatCount).filtered

  function dfs(cols: ColumnType[], startColIndex: number) {
    let leafCount = 0

    const filtered: IndexedCol[] = []

    cols.forEach((col) => {
      const colIndex = startColIndex + leafCount
      if (isLeafNode(col)) {
        leafCount += 1
        if (leftFlatCount + hoz.leftIndex <= colIndex && colIndex < leftFlatCount + hoz.rightIndex) {
          filtered.push({ colIndex, col })
        }
      } else {
        const dfsRes = dfs(col.children, colIndex)
        leafCount += dfsRes.leafCount
        if (dfsRes.filtered.length > 0) {
          filtered.push({ colIndex, col, children: dfsRes.filtered })
        }
      }
    })

    return { filtered, leafCount }
  }
}

/** 根据输入的 nested 列配置，算出相应的 leveled & flat 配置方便渲染 */
function calculateLeveledAndFlat(inputNested: IndexedCol[], rowCount: number) {
  const leveled: ColWithRenderInfo[][] = []
  for (let depth = 0; depth < rowCount; depth++) {
    leveled.push([])
  }
  const flat: ColWithRenderInfo[] = []

  dfs(inputNested, 0)

  return { flat, leveled }

  function dfs(input: IndexedCol[], depth: number) {
    let leafCount = 0
    for (let i = 0; i < input.length; i++) {
      const indexedCol = input[i]

      if (isLeafNode(indexedCol)) {
        leafCount += 1
        const wrapped = {
          type: 'normal' as const,
          width: indexedCol.col.width as number,
          col: indexedCol.col,
          colIndex: indexedCol.colIndex,
          colSpan: 1,
          isLeaf: true,
        }
        leveled[depth].push(wrapped)
        flat.push(wrapped)
      } else {
        const dfsRes = dfs(indexedCol.children, depth + 1)
        leafCount += dfsRes.leafCount
        if (dfsRes.leafCount > 0) {
          leveled[depth].push({
            type: 'normal',
            width: indexedCol.col.width as number,
            col: indexedCol.col,
            colIndex: indexedCol.colIndex,
            colSpan: dfsRes.leafCount,
            isLeaf: false,
          })
        }
      }
    }

    return { leafCount }
  }
}

/** 包装列配置，附加上 colIndex 属性 */
function attachColIndex(inputNested: ColumnType[], colIndexOffset: number) {
  return dfs(inputNested, colIndexOffset).result

  function dfs(input: ColumnType[], startColIndex: number) {
    const result: IndexedCol[] = []

    let leafCount = 0
    for (let i = 0; i < input.length; i++) {
      const col = input[i]
      const colIndex = startColIndex + leafCount

      if (isLeafNode(col)) {
        leafCount += 1
        result.push({ colIndex, col })
      } else {
        const sub = dfs(col.children, colIndex)
        leafCount += sub.leafCount
        if (sub.leafCount > 0) {
          result.push({ col, colIndex, children: sub.result })
        }
      }
    }
    return { result, leafCount }
  }
}

/** 计算用于渲染表头的数据结构 */
function calculateHeaderRenderInfo(
  { flat, nested, horizontalRenderRange: hoz, useVirtual }: RenderInfo,
  rowCount: number
): { flat: ColWithRenderInfo[]; leveled: ColWithRenderInfo[][] } {
  if (useVirtual.header) {
    const leftPart = calculateLeveledAndFlat(attachColIndex(nested.left, 0), rowCount)
    const filtered = filterNestedCenter(nested.center, hoz, flat.left.length)
    const centerPart = calculateLeveledAndFlat(filtered, rowCount)
    const rightPart = calculateLeveledAndFlat(
      attachColIndex(nested.right, flat.left.length + flat.center.length),
      rowCount
    )

    return {
      flat: [
        ...leftPart.flat,
        { type: 'blank', width: hoz.leftBlank, blankSide: 'left' },
        ...centerPart.flat,
        { type: 'blank', width: hoz.rightBlank, blankSide: 'right' },
        ...rightPart.flat,
      ],
      leveled: range(rowCount).map((depth) => [
        ...leftPart.leveled[depth],
        { type: 'blank', width: hoz.leftBlank, blankSide: 'left' },
        ...centerPart.leveled[depth],
        { type: 'blank', width: hoz.rightBlank, blankSide: 'right' },
        ...rightPart.leveled[depth],
      ]),
    }
  }

  return calculateLeveledAndFlat(attachColIndex(nested.full, 0), rowCount)
}

interface TableHeaderProps {
  info: RenderInfo
  theaderPosition?: 'left' | 'center' | 'right'
  rowCount?: number
  stickyRightOffset?: number
}

export default function TableHeader({
  info,
  theaderPosition,
  rowCount: _rowCount,
  stickyRightOffset,
}: TableHeaderProps) {
  const { nested, flat, stickyLeftMap, stickyRightMap, onHeaderRow } = info
  const rowCount = _rowCount ?? getTreeDepth(nested.full) + 1
  const headerRenderInfo = calculateHeaderRenderInfo(info, rowCount)

  const { Classes, getComponent } = useBaseTableContext()

  const fullFlatCount = flat.full.length
  const leftFlatCount = flat.left.length
  const rightFlatCount = flat.right.length

  // =================== Render: Node ===================
  const TableComponent = getComponent(['table'], 'table')
  const WrapperComponent = getComponent(['header', 'wrapper'], 'thead')
  const TrComponent = getComponent(['header', 'row'], 'tr')
  const ThComponent = getComponent(['header', 'cell'], 'th')

  const thead = headerRenderInfo.leveled.map((wrappedCols, level) => {
    const _wrappedCols = wrappedCols.concat()
    // 左中右区域渲染，分组列可能单独位于一个区域，此时其他区域也需要适配分组的高度
    // rowspan 需要空白的列头去占位, 需要补充额外的空白列头
    if (rowCount > 1 && ['left', 'right'].indexOf(theaderPosition) > -1) {
      _wrappedCols.push({ type: 'blank', blankSide: 'left', width: 1, isPlacehoder: true })
    }
    const headerCells = _wrappedCols.map((wrapped) => {
      if (wrapped.type === 'normal') {
        const { colIndex, colSpan, isLeaf, col } = wrapped
        const finalColSpan = col.colSpan ?? colSpan

        const { onHeaderCell } = col

        const positionStyle: CSSProperties = {}
        if (colIndex < leftFlatCount) {
          positionStyle.position = 'sticky'
          positionStyle.left = stickyLeftMap.get(colIndex)
        } else if (colIndex >= fullFlatCount - rightFlatCount) {
          positionStyle.position = 'sticky'
          positionStyle.right =
            stickyRightMap.get(colIndex) + (typeof stickyRightOffset === 'number' ? stickyRightOffset : 0)
        }

        const justifyContent = col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start'

        // ============================ title =============================
        const title = getTitleFromCellRenderChildren({
          rowType: 'header',
          ellipsis: col.ellipsis,
          children: col.title ?? col.name,
        })

        const cell = (
          <ThComponent
            key={col.key}
            {...onHeaderCell?.(col)}
            className={cx(Classes?.tableHeaderCell, col.className, onHeaderCell?.(col)?.className, {
              [Classes?.first]: colIndex === 0,
              [Classes?.last]: colIndex + finalColSpan === fullFlatCount,
              [Classes?.lockLeft]: colIndex < leftFlatCount || theaderPosition === 'left',
              [Classes?.lockRight]: colIndex >= fullFlatCount - rightFlatCount || theaderPosition === 'right',
              [Classes?.leaf]: wrapped.isLeaf,
            })}
            colSpan={finalColSpan}
            rowSpan={isLeaf ? rowCount - level : undefined}
            style={{
              textAlign: col.align,
              verticalAlign: col.verticalAlign ?? 'middle',
              ...onHeaderCell?.(col)?.style,
              ...positionStyle,
            }}
            data-index={col.dataIndex}
          >
            {theaderPosition === 'center' && positionStyle.position === 'sticky' ? null : (
              <div
                className={cx(Classes?.tableHeaderCellContent, {
                  [Classes?.tableCellEllipsis]: col.ellipsis,
                })}
                style={{ justifyContent }}
                title={title}
              >
                {col.title ?? col.name}
              </div>
            )}
          </ThComponent>
        )
        return cell
      }
      if (wrapped.width > 0) {
        return (
          <ThComponent key={wrapped.blankSide} style={{ visibility: wrapped.isPlacehoder ? 'hidden' : undefined }} />
        )
      }
      return null
    })

    const headerRowProps = onHeaderRow?.(_wrappedCols, 0)

    return (
      <TrComponent
        {...headerRowProps}
        key={level}
        className={cx(Classes?.tableHeaderRow, headerRowProps?.className, {
          [Classes?.first]: level === 0,
          [Classes?.last]: level === rowCount - 1,
        })}
      >
        {headerCells}
      </TrComponent>
    )
  })

  const colgroup = headerRenderInfo.flat.map((wrapped) => {
    if (wrapped.type === 'blank') {
      if (typeof wrapped.width === 'string' || wrapped.width > 0) {
        return <col key={wrapped.blankSide} style={{ width: wrapped.width }} />
      }
      return null
    }
    return <col key={wrapped.colIndex} style={{ width: wrapped.width }} />
  })

  return (
    <TableComponent className={Classes?.tableDom}>
      <colgroup>{colgroup}</colgroup>
      <WrapperComponent className={Classes?.tableHeaderThead}>{thead}</WrapperComponent>
    </TableComponent>
  )
}
