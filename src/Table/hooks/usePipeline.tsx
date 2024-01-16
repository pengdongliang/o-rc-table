import { features, makeRecursiveMapper, TablePipeline, useTablePipeline } from 'o-rc-table'

import { TableProps } from '../InternalTable'

type PipeMapType = {
  /** 拖动列宽 */
  dragColumnWidth: () => TablePipeline
  /** 自动行高 */
  autoRowHeight: () => TablePipeline
  /** 自动合并多行 */
  autoRowSpan: () => TablePipeline
  /** 拖拽列排序 */
  columnDrag: () => TablePipeline
}

/**
 * 处理所需的表格功能
 */
export const usePipeline = (props: TableProps) => {
  const { dataSource, columns, dragColumnWidth, autoRowHeight, autoRowSpan, columnDrag } = props

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
    autoRowHeight: () => {
      const style = typeof autoRowHeight === 'object' ? autoRowHeight : {}
      return pipeline.mapColumns(
        makeRecursiveMapper((col) => {
          if (!col.ellipsis) {
            col.render = (value) => {
              return <div style={style}>{value}</div>
            }
          }
          return col
        })
      )
    },
    autoRowSpan: () => {
      return pipeline.use(features.autoRowSpan())
    },
    columnDrag: () => {
      return pipeline.use(features.columnDrag(columnDrag))
    },
  }

  const runPipeline = (pipeNames: Record<string, any>) => {
    Object.keys(pipeNames).forEach((name) => {
      pipeNames[name] && pipeMap[name]?.()
    })
  }

  runPipeline({ dragColumnWidth, autoRowHeight, autoRowSpan, columnDrag })

  return pipeline
}
