import { Checkbox, Input, Radio } from 'antd'
import { features, makeRecursiveMapper, TablePipeline, useTablePipeline } from 'o-rc-table'
import { useMemo } from 'react'

import { TableProps } from '../InternalTable'

type PipeMapType = {
  /** 列宽拖拽 */
  dragColumnWidth: () => TablePipeline
  /** 自动行高 */
  autoRowHeight: () => TablePipeline
  /** 自动合并多行 */
  autoRowSpan: () => TablePipeline
  /** 拖拽列排序 */
  columnDrag: () => TablePipeline
  /** 列分组展开收起 */
  columnGroupExpand: () => TablePipeline
  /** 列高亮 */
  columnHighlight: () => TablePipeline
  /** 排序 */
  sort: () => TablePipeline
  /** 过滤 */
  filter: () => TablePipeline
  /** 行选择 */
  rowSelection: () => TablePipeline
}

/**
 * 处理所需的表格功能
 */
export const usePipeline = (props: TableProps) => {
  const {
    components,
    dataSource,
    columns,
    rowKey = 'id',
    dragColumnWidth,
    autoRowHeight,
    autoRowSpan,
    columnDrag,
    columnGroupExpand,
    columnHighlight,
    sort,
    filter,
    rowSelection,
  } = props

  const pipeline = useTablePipeline({ components: { Checkbox, Radio, Input, ...components } })
    .input({ dataSource, columns })
    .rowKey(rowKey)
    .use(features.columnResize())

  const pipeMap = useMemo<PipeMapType>(() => {
    return {
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
        const options = typeof autoRowHeight === 'object' ? autoRowHeight : {}
        return pipeline.mapColumns(
          makeRecursiveMapper((col) => {
            if (!col.ellipsis) {
              col.render = (value) => {
                return <div style={options}>{value}</div>
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
        const options = typeof columnDrag === 'object' ? columnDrag : {}
        return pipeline.use(features.columnDrag(options))
      },
      columnGroupExpand: () => {
        const options = typeof columnGroupExpand === 'object' ? columnGroupExpand : {}
        return pipeline.use(features.colGroupExtendable(options))
      },
      columnHighlight: () => {
        const options = typeof columnHighlight === 'object' ? columnHighlight : {}
        return pipeline.use(features.columnRangeHover(options))
      },
      sort: () => {
        const options = typeof sort === 'object' ? sort : {}
        return pipeline.use(features.sort(options))
      },
      filter: () => {
        const options = typeof filter === 'object' ? filter : {}
        return pipeline.use(features.filter(options))
      },
      rowSelection: () => {
        const {
          type = 'checkbox',
          selectedRowKeys,
          onChange,
          fixed = true,
          columnWidth,
          defaultSelectedRowKeys,
          onCell,
          ...rowSelectionRest
        } = rowSelection
        const baseOptions: features.MultiSelectFeatureOptions = {
          ...rowSelectionRest,
          value: selectedRowKeys,
          onChange: (rowKeys, rows, _key, _batchKeys, info) => {
            onChange?.(rowKeys, rows, { type: info })
          },
          defaultValue: defaultSelectedRowKeys,
          highlightRowWhenSelected: false,
          clickArea: 'cell',
          placement: 'start',
          columnProps: {
            fixed,
            width: columnWidth as number,
            getCellProps: (_text, record, rowIndex) => onCell(record, rowIndex),
          },
        }

        if (type === 'checkbox') {
          return pipeline.use(
            features.multiSelect({
              ...baseOptions,
            })
          )
        }
        return pipeline.use(
          features.singleSelect({
            ...(baseOptions as features.SingleSelectFeatureOptions),
          })
        )
      },
    }
  }, [
    autoRowHeight,
    columnDrag,
    columnGroupExpand,
    columnHighlight,
    dragColumnWidth,
    pipeline,
    sort,
    filter,
    rowSelection,
  ])

  const runPipeline = (pipeNames: Record<string, any>) => {
    Object.keys(pipeNames).forEach((name) => {
      pipeNames[name] && pipeMap[name]?.()
    })
  }

  runPipeline({
    dragColumnWidth,
    autoRowHeight,
    autoRowSpan,
    columnDrag,
    columnGroupExpand,
    columnHighlight,
    sort,
    filter,
    rowSelection,
  })

  return pipeline
}
