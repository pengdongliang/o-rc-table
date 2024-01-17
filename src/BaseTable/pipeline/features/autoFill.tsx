import { getLeftNestedLockCount } from '../../base/calculations'
import { ColumnType } from '../../interfaces'
import { isLeafNode, makeRecursiveMapper } from '../../utils'
import { TablePipeline } from '../pipeline'
import { COLUMN_SIZE_KEY, LAST_RESIZED_COLUMN_KEY, RESIZED_COLUMN_KEY } from './columnResizeWidth'

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
    const columns = pipeline.getColumns()
    const fillColumns = columns.find((col) => col.dataIndex === FILL_COLUMN_CODE)
    const width = getTableRemainingWidth(pipeline) || 0
    if (fillColumns) {
      fillColumns.width = width
    } else {
      const rightNestedLockCount = getLeftNestedLockCount(columns.slice().reverse())
      const spliceIndex = columns.length - rightNestedLockCount
      const newFillColumns = {
        name: '',
        dataIndex: FILL_COLUMN_CODE,
        key: FILL_COLUMN_CODE,
        width,
        features: {
          resizeable: false,
        },
        getCellProps: () => {
          return {
            className: pipeline.getTableContext().Classes?.emptyColCell,
          }
        },
      }
      columns.splice(spliceIndex || columns.length, 0, newFillColumns)
    }
    pipeline.columns(columns)
  }

  return pipeline

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

function getColumnWidthSum(pipeline: TablePipeline) {
  return dfs(pipeline.getColumns())
  function dfs(columns: ColumnType[]) {
    return columns.reduce((acc, col) => {
      const { width, dataIndex } = col
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
