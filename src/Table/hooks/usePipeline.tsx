import { features, makeRecursiveMapper, TablePipeline, useTablePipeline } from 'o-rc-table'

import { TableProps } from '../InternalTable'

type PipeMapType = {
  dragColumnWidth: () => TablePipeline
  autoHeight: () => TablePipeline
}

/**
 * 处理所需的表格功能
 */
export const usePipeline = (props: TableProps) => {
  const { dataSource, columns, dragColumnWidth, autoHeight } = props

  const pipeline = useTablePipeline().input({ dataSource, columns }).rowKey('id')

  const pipeMap: PipeMapType = {
    dragColumnWidth: () => {
      const options = typeof dragColumnWidth === 'object' ? dragColumnWidth : {}
      return pipeline.use(
        features.columnResize({
          minSize: 100,
          ...options,
        })
      )
    },
    autoHeight: () => {
      return pipeline.mapColumns(
        makeRecursiveMapper((col) => {
          return col
        })
      )
    },
  }

  const runPipeline = (pipeNames: Record<string, any>) => {
    Object.keys(pipeNames).forEach((name) => {
      pipeNames[name] && pipeMap[name]?.()
    })
  }

  runPipeline({ dragColumnWidth, autoHeight })

  return pipeline
}
