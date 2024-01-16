import { ColumnType, TableTransform } from '../interfaces'
import isLeafNode from './isLeafNode'

type NormalizeAsArrayInput<T> = null | T | T[]

function normalizeAsArray(input: NormalizeAsArrayInput<ColumnType>): ColumnType[] {
  if (input == null) {
    return []
  }
  if (Array.isArray(input)) {
    return input
  }
  return [input]
}

/** @deprecated 该 API 已经过时，请使用 makeRecursiveMapper */
export default function traverseColumn(
  fn: (
    column: ColumnType,
    ctx: { range: { start: number; end: number }; dataSource: any[] }
  ) => NormalizeAsArrayInput<ColumnType>
): TableTransform {
  return ({ columns, dataSource }) => {
    return { dataSource, columns: dfs(columns, 0).result }

    function dfs(cols: ColumnType[], parentStartColIndex: number): { flatColCount: number; result: ColumnType[] } {
      let flatColCount = 0
      const result: ColumnType[] = []

      for (const col of cols) {
        const startColIndex = parentStartColIndex + flatColCount

        let unNormalized
        if (isLeafNode(col)) {
          unNormalized = fn(col, {
            range: { start: startColIndex, end: startColIndex + 1 },
            dataSource,
          })
          flatColCount += 1
        } else {
          const dfsResult = dfs(col.children, startColIndex)
          unNormalized = fn(
            {
              ...col,
              children: dfsResult.result,
            },
            {
              range: {
                start: startColIndex,
                end: startColIndex + dfsResult.flatColCount,
              },
              dataSource,
            }
          )
          flatColCount += dfsResult.flatColCount
        }
        result.push(...normalizeAsArray(unNormalized))
      }

      return { result, flatColCount }
    }
  }
}
