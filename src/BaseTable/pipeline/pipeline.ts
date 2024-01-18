import { useRef, useState } from 'react'

import { BaseTableContextProps, RowKey, TableProps, useBaseTableContext } from '../base'
import { ColumnType, TableTransform, Transform } from '../interfaces'
import { mergeCellProps } from '../utils'
import { autoFillTableWidth, tableWidthKey } from './features/autoFill'

type RowPropsGetter = TableProps['getRowProps']

type InputType<RecordType = Record<string, any>> =
  | {
      dataSource: RecordType[]
      columns: ColumnType[]
      tableContext?: BaseTableContextProps
    }
  | {
      dataSource?: RecordType[]
      columns?: ColumnType[]
      tableContext: BaseTableContextProps
    }

interface PipelineSnapshot {
  dataSource: any[]
  columns: ColumnType[]
  rowPropsGetters: RowPropsGetter[]
  tableContext: BaseTableContextProps
}

export interface TablePipelineIndentsConfig {
  iconIndent: number
  iconWidth: number
  iconGap: number
  indentSize: number
}

export interface TablePipelineCtx {
  rowKey?: RowKey<any>
  components: { [name: string]: any }
  indents: TablePipelineIndentsConfig

  [key: string]: any
}

/**
 * 表格数据处理流水线。TablePipeline 提供了表格数据处理过程中的一些上下文与工具方法，包括……
 *
 * 1. ctx：上下文环境对象，step（流水线上的一步）可以对 ctx 中的字段进行读写。
 * ctx 中部分字段名称有特定的含义（例如 rowKey 表示行的主键），使用自定义的上下文信息时注意避开这些名称。
 *
 * 2. rowPropsGetters：getRowProps 回调队列，step 可以通过 pipeline.appendRowPropsGetter 向队列中追加回调函数，
 *   在调用 pipeline.props() 队列中的所有函数会组合形成最终的 getRowProps
 *
 * 3. 当前流水线的状态，包括 dataSource, columns, rowPropsGetters 三个部分
 *
 * 4. snapshots，调用 pipeline.snapshot(name) 可以记录当前的状态，后续可以通过 name 来读取保存的状态
 * */
export class TablePipeline<RecordType = unknown> {
  ref?: React.MutableRefObject<any>

  private readonly _snapshots: { [key: string]: PipelineSnapshot } = {}

  private readonly _rowPropsGetters: Array<RowPropsGetter> = []

  private _tableProps: React.HTMLAttributes<HTMLTableElement> = {}

  private _dataSource: RecordType[]

  private _columns: any[]

  private _footerDataSource?: any[]

  private _tableContext?: BaseTableContextProps

  static defaultIndents: TablePipelineIndentsConfig = {
    iconIndent: 0,
    iconWidth: 12,
    iconGap: 8,
    indentSize: 12,
  }

  readonly ctx: TablePipelineCtx = {
    components: {},
    indents: TablePipeline.defaultIndents,
  }

  private readonly state: any

  private readonly setState: (fn: (prevState: any) => any, stateKey: string, partialState: any, extraInfo?: any) => any

  constructor({
    state,
    setState,
    ctx,
    ref,
  }: {
    state: any
    setState: TablePipeline['setState']
    ctx: Partial<TablePipelineCtx>
    ref?: React.MutableRefObject<any>
  }) {
    this.state = state
    this.setState = setState
    this.ref = ref
    Object.assign(this.ctx, ctx)
  }

  /**
   * 通过连接随机十六进制生成伪GUID
   */
  guid() {
    function S4() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
    }

    return `${S4() + S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`
  }

  appendRowPropsGetter(getter: RowPropsGetter) {
    this._rowPropsGetters.push(getter)
    return this
  }

  addTableProps(props: React.HTMLAttributes<HTMLTableElement>) {
    this._tableProps = mergeCellProps(this._tableProps as any, props as any) as any
  }

  getDataSource(name?: string) {
    if (name == null) {
      return this._dataSource
    }
    return this._snapshots[name].dataSource
  }

  getColumns(name?: string) {
    if (name == null) {
      return this._columns
    }
    return this._snapshots[name].columns
  }

  getTableContext(name?: string) {
    if (name == null) {
      return this._tableContext
    }
    return this._snapshots[name].tableContext
  }

  getFooterDataSource() {
    return this._footerDataSource
  }

  getStateAtKey<T = any>(stateKey: string, defaultValue?: T): T {
    return this.state[stateKey] ?? defaultValue
  }

  /**
   * 将 stateKey 对应的状态设置为 partialState
   */
  setStateAtKey(stateKey: string, partialState: any, extraInfo?: any) {
    this.setState((prev: any) => ({ ...prev, [stateKey]: partialState }), stateKey, partialState, extraInfo)
  }

  /**
   * 确保 rowKey 已被设置，并返回 rowKey
   */
  ensurePrimaryKey(hint?: string): RowKey<any> {
    if (this.ctx.rowKey == null) {
      throw new Error(hint ? `RowKey must be set before using ${hint}` : 'Must be set first `rowKey`')
    }
    return this.ctx.rowKey
  }

  /**
   * 设置流水线的输入数据
   */
  input(input: InputType<RecordType>) {
    if (this._dataSource != null || this._columns != null) {
      throw new Error('Input cannot be called twice')
    }

    this._dataSource = input.dataSource

    this._columns = input.columns?.map((col) => {
      let { width } = col ?? {}
      if (typeof width === 'string') {
        // TODO 列宽度为百分比或者带单位的情况下看看如何更好地兼容成具体数值
        width = Number((width as string).replace(/[^0-9]/g, ''))
      }
      return { ...col, key: this.guid(), width }
    })

    if (input.tableContext) {
      this._tableContext = input.tableContext
    }

    this.snapshot('input')
    return this
  }

  /**
   * 设置 dataSource
   */
  dataSource(rows: any[]) {
    this._dataSource = rows
    return this
  }

  /**
   * 设置 columns
   */
  columns(cols: ColumnType[]) {
    this._columns = cols
    return this
  }

  /**
   * 设置主键
   */
  rowKey(key: RowKey<any>) {
    this.ctx.rowKey = key
    return this
  }

  /**
   * 设置页脚数据
   */
  footerDataSource(rows: any[]) {
    this._footerDataSource = rows
    return this
  }

  /**
   * 保存快照
   */
  snapshot(name: string) {
    this._snapshots[name] = {
      dataSource: this._dataSource,
      columns: this._columns,
      rowPropsGetters: this._rowPropsGetters.slice(),
      tableContext: this._tableContext,
    }
    return this
  }

  /**
   * 应用一个 o-rc-table Table transform
   * @deprecated
   */
  useTransform(transform: TableTransform) {
    const next = transform({
      dataSource: this.getDataSource(),
      columns: this.getColumns(),
    })
    return this.dataSource(next.dataSource).columns(next.columns)
  }

  /**
   * 使用 pipeline 功能拓展
   */
  use(step: (pipeline: this) => this) {
    return step(this)
  }

  /**
   * 转换 dataSource
   */
  mapDataSource(mapper: Transform<any[]>) {
    return this.dataSource(mapper(this.getDataSource()))
  }

  /**
   * 转换 columns
   */
  mapColumns(mapper: Transform<ColumnType[]>) {
    return this.columns(mapper(this.getColumns()))
  }

  /**
   * 获取featureOptions 内容
   */
  getFeatureOptions(optionKey: string) {
    return this.ref.current.featureOptions?.[optionKey]
  }

  /**
   * 设置pipelineOptions 内容
   */
  setFeatureOptions(optionKey: string, value: any) {
    this.ref.current.featureOptions[optionKey] = value
  }

  /**
   * 获取 BaseTable 的 props，结果中包含 dataSource/columns/rowKey/getRowProps 四个字段
   */
  getProps(this: TablePipeline) {
    this.use(autoFillTableWidth())
    const result: TableProps = {
      dataSource: this._dataSource,
      columns: this._columns,
    }
    if (this.ctx.rowKey) {
      result.rowKey = this.ctx.rowKey
    }

    if (this._footerDataSource) {
      result.footerDataSource = this._footerDataSource
    }

    if (this._rowPropsGetters.length > 0) {
      result.getRowProps = (row, rowIndex) => {
        return this._rowPropsGetters.reduce<any>((res, get) => {
          return mergeCellProps(res, get(row, rowIndex) as any)
        }, {})
      }
    }

    result.getTableProps = () => this._tableProps
    result.setTableWidth = (tableWidth: number) => {
      const preTableWidth = this.getStateAtKey(tableWidthKey)
      if (preTableWidth !== tableWidth) {
        tableWidth && this.setStateAtKey(tableWidthKey, tableWidth)
      }
    }
    result.setTableDomHelper = (domHelper) => {
      this.ref.current.domHelper = domHelper
    }

    result.setRowHeightManager = (rowHeightManager) => {
      this.ref.current.rowHeightManager = rowHeightManager
    }

    return result
  }
}

export function useTablePipeline<RecordType = unknown>(ctx?: Partial<TablePipelineCtx>) {
  const [state, setState] = useState<any>({})
  const ref = useRef<any>({ featureOptions: {} })

  const tableContext = useBaseTableContext()

  return new TablePipeline<RecordType>({ state, setState, ctx, ref }).input({ tableContext })
}
