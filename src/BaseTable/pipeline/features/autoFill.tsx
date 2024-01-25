import { ColumnType } from '../../interfaces'
import { isLeafNode, makeRecursiveMapper } from '../../utils'
import { TablePipeline } from '../pipeline'
import { COLUMN_SIZE_KEY, LAST_RESIZED_COLUMN_KEY, RESIZED_COLUMN_KEY } from './columnResizeWidth'
import { CHECKBOX_COLUMN_KEY } from './multiSelect'
import { EXPAND_COLUMN_KEY } from './rowDetail'
import { RADIO_COLUMN_KEY } from './singleSelect'

export const FILL_COLUMN_CODE = '$_fill_column_&'

export const tableWidthKey = 'tableWidth'

const FLEX_COLUMN_COUNT = Symbol('flexCount')

export const autoFillTableWidth = () => (pipeline: TablePipeline) => {
  const flexColumnResult = findFlexColumns(pipeline)
  const flexCount = flexColumnResult.get(FLEX_COLUMN_COUNT)
  if (flexCount) {
    // 设置了flex宽度，flex列平分剩余宽度
    const remainingWidth = getTableRemainingWidth(pipeline) || 0
    if (remainingWidth > 0) {
      // 保存剩余的flex总和和剩余宽度总和宽度
      let residualFlexCount = flexCount
      let residualFlexWidth = remainingWidth
      const columnSize = pipeline.getFeatureOptions(COLUMN_SIZE_KEY)
      const enableColumnResizeWidthFeature = !!columnSize
      pipeline.mapColumns(
        makeRecursiveMapper((col, recursiveFlatMapInfo) => {
          const { isLeaf } = recursiveFlatMapInfo
          if (isLeaf && isValidFlexColumn(col, pipeline)) {
            const { dataIndex, features = {} } = col
            const { flex, minWidth = 0, maxWidth = Number.MAX_SAFE_INTEGER } = features
            const usedRemainingWidth = Math.floor((remainingWidth * flex) / flexCount)
            const preColWidth = col.width as number
            // 如果当前已经是最后一个flex列，将剩余的宽度添加到该列，其他计算相应的列
            col.width = clamp(
              minWidth,
              preColWidth + (residualFlexCount === flex ? residualFlexWidth : usedRemainingWidth),
              maxWidth
            )
            residualFlexCount -= flex
            residualFlexWidth -= col.width - preColWidth
            if (enableColumnResizeWidthFeature) {
              columnSize[dataIndex] = col.width
            }
          }
          return col
        })
      )
      enableColumnResizeWidthFeature && pipeline.setFeatureOptions(COLUMN_SIZE_KEY, columnSize)
    }
  } else {
    // 未设置了flex宽度，创建占位列
    // const columns = pipeline.getColumns()
    const width = getTableRemainingWidth(pipeline) || 0
    // const fillColumns = columns.find((col) => col.dataIndex === FILL_COLUMN_CODE)
    // if (fillColumns) {
    //   fillColumns.width = width
    // } else {
    //   const rightNestedLockCount = getLeftNestedLockCount(columns.slice().reverse())
    //   const spliceIndex = columns.length - rightNestedLockCount
    //   const newFillColumns = {
    //     name: '',
    //     dataIndex: FILL_COLUMN_CODE,
    //     key: FILL_COLUMN_CODE,
    //     width,
    //     features: {
    //       resizeable: false,
    //     },
    //     onCell: () => {
    //       return {
    //         className: pipeline.getTableContext().Classes?.emptyColCell,
    //       }
    //     },
    //   }
    //   columns.splice(spliceIndex || columns.length, 0, newFillColumns)
    // }
    // pipeline.columns(columns)
    if (width > 0) {
      // 未设置flex宽度，除了内置的特殊列(展开, 选择), 其它每一列设置动态宽度
      const { columns, remainingWidthSum } = getPercentageColumn(pipeline)
      if (remainingWidthSum > 0) {
        pipeline.columns(appendLastColumnWidth(columns, remainingWidthSum))
      }
    }
  }

  return pipeline

  function appendLastColumnWidth(cols: ColumnType[], remainingWidthSum: number) {
    const lastColumn = cols[cols.length - 1]
    if (isLeafNode(lastColumn)) {
      cols[cols.length - 1].width = remainingWidthSum + (lastColumn.width ?? 0)
    } else if (lastColumn.children?.length) {
      cols[cols.length - 1].children = appendLastColumnWidth(lastColumn.children, remainingWidthSum)
    }
    return cols
  }

  function findFlexColumns(findPipeline: TablePipeline) {
    const result = new Map([[FLEX_COLUMN_COUNT, 0]])
    dfs(findPipeline.getColumns(), result)
    return result
    function dfs(columns: ColumnType[], newResult: Map<any, any>) {
      columns.forEach((col) => {
        if (isLeafNode(col)) {
          if (isValidFlexColumn(col, findPipeline)) {
            newResult.set(FLEX_COLUMN_COUNT, newResult.get(FLEX_COLUMN_COUNT) + col.features.flex)
          }
        } else {
          dfs(col.children, newResult)
        }
      })
    }
  }
}

function getPercentageColumn(pipeline: TablePipeline) {
  let tableWidth = pipeline.ref.current.domHelper?.tableBody?.clientWidth || pipeline.getStateAtKey(tableWidthKey)
  if (!tableWidth) return
  const columnsWidthSum = getColumnWidthSum(pipeline, excludeKeys)
  const excludeKeys = [CHECKBOX_COLUMN_KEY, RADIO_COLUMN_KEY, EXPAND_COLUMN_KEY]
  const cols = pipeline.getColumns()
  const remainingWidth = Math.floor(tableWidth - columnsWidthSum)
  const preRemainingWidthSum = tableWidth
  const aa = dfs(cols, preRemainingWidthSum)

  return aa

  function dfs(columns: ColumnType[], remainingWidthSum: number) {
    const emptyColumns = columns.reduce((pre, cur) => {
      if (cur.width === undefined) {
        pre.push(cur.key)
      }
      return pre
    }, [])
    if (emptyColumns.length) {
      columns.forEach((col) => {
        if (emptyColumns.includes(col.key)) {
          const width = Math.floor(remainingWidth / emptyColumns.length)
          col.width = width < 120 ? 120 : width
        }
      })
    } else {
      columns.forEach((col) => {
        if (col?.features?.flex !== false) {
          if (!isLeafNode(col) && col.children?.length) {
            const newList = dfs(col.children, remainingWidthSum)
            col.children = newList?.columns
            remainingWidthSum = newList?.remainingWidthSum ?? 0
          } else if (!excludeKeys.includes(col.key)) {
            if (col.width === undefined) {
              col.width = Math.floor(0.01 * tableWidth)
            } else {
              col.width = Math.floor((col.width / columnsWidthSum) * tableWidth)
            }
          } else {
            tableWidth -= col.width ?? 0
          }
        }
        if (isLeafNode(col)) {
          remainingWidthSum -= col.width ?? 0
        }
      })
    }
    return { columns, remainingWidthSum }
  }
}

function getColumnWidthSum(pipeline: TablePipeline, excludeKeys?: string[]) {
  return dfs(pipeline.getColumns())
  function dfs(columns: ColumnType[]) {
    return columns.reduce((acc, col) => {
      const { width, dataIndex, key } = col
      if (Array.isArray(excludeKeys) && excludeKeys.length && excludeKeys.includes(key)) return acc
      if (isLeafNode(col) && dataIndex !== FILL_COLUMN_CODE) {
        const resizeColumn = pipeline.getFeatureOptions(COLUMN_SIZE_KEY)
        return acc + ((resizeColumn && resizeColumn[dataIndex]) || width)
      }
      return acc + dfs(col.children)
    }, 0)
  }
}

function getTableRemainingWidth(pipeline: TablePipeline) {
  const tableWidth = pipeline.ref.current.domHelper?.tableBody?.clientWidth || pipeline.getStateAtKey(tableWidthKey)
  if (!tableWidth) return
  const remainingWidth = Math.floor(tableWidth - getColumnWidthSum(pipeline))
  return remainingWidth > 0 ? remainingWidth : 0
}

function isAfterLastResizeCol(column: ColumnType, pipeline: TablePipeline) {
  const lastResizedColumnCode = pipeline.getFeatureOptions(LAST_RESIZED_COLUMN_KEY)
  if (lastResizedColumnCode === undefined) return true
  const lastResizedColumnIndex = pipeline.getColumns().findIndex((col) => col.dataIndex === lastResizedColumnCode)
  const colIndex = pipeline.getColumns().findIndex((col) => col.dataIndex === column.dataIndex)
  return colIndex > lastResizedColumnIndex
}

function isValidFlexColumn(col: ColumnType, pipeline: TablePipeline) {
  const resizeColumn = pipeline.getFeatureOptions(RESIZED_COLUMN_KEY)
  // 拖拽列自动禁止flex
  if (resizeColumn?.has(col.dataIndex)) {
    return false
  }
  const flex = col.features?.flex
  return typeof flex === 'number' && flex > 0 && isAfterLastResizeCol(col, pipeline)
}

function clamp(min: number, x: number, max: number) {
  return Math.max(min, Math.min(max, x))
}
