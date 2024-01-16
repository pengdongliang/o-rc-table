import { useEvents, usePipeline, useTablePagination } from '@table/hooks'
import { Spin, type SpinProps } from 'antd'
import { type ConfigConsumerProps, ConfigContext } from 'antd/es/config-provider'
import { FilterValue, SorterResult, TableCurrentDataSource } from 'antd/es/table/interface'
import classNames from 'classnames'
import { useTablePipeline } from 'o-rc-table'
import type { BaseTableProps } from 'o-rc-table/base/table'
import * as React from 'react'

import useCSSVarCls from '../ConfigProvider/hooks/useCSSVarCls'
import type { AnyObject } from '../theme/interface'
import type { TableFeaturesType, TablePaginationConfig } from './interface'
import RcTable from './RcTable'
import useStyle from './style'

export type SizeType = 'small' | 'middle' | 'large' | undefined
export type TableRef = ReturnType<typeof useTablePipeline>

export interface TableProps<RecordType = any> extends Omit<BaseTableProps<RecordType>, 'loading'>, TableFeaturesType {
  /** 前缀 */
  prefixCls?: string
  /** class name */
  className?: string
  /** style */
  style?: React.CSSProperties
  /** 是否加载中 */
  loading?: boolean | SpinProps
  /** 分页 */
  pagination?: false | TablePaginationConfig
  /** 表格尺寸 */
  size?: SizeType
  /** 分页、排序、筛选变化时触发 */
  onChange?: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<RecordType> | SorterResult<RecordType>[],
    extra: TableCurrentDataSource<RecordType>
  ) => void
}

/** Same as `TableProps` but we need record parent render times */
export interface InternalTableProps<RecordType> extends TableProps<RecordType> {
  _renderTimes: number
}

const InternalTable = <RecordType extends AnyObject = AnyObject>(
  props: InternalTableProps<RecordType>,
  ref: React.Ref<TableRef>
) => {
  const pipeline = usePipeline(props)

  const finalProps = { ...props, ...pipeline.getProps() }
  const { prefixCls: customizePrefixCls, className, style, dataSource, columns, loading, ...rest } = finalProps

  const { getPrefixCls, table } = React.useContext<ConfigConsumerProps>(ConfigContext)

  const mergedStyle: React.CSSProperties = { ...table?.style, ...style }
  const prefixCls = getPrefixCls('table', customizePrefixCls)
  const rootCls = useCSSVarCls(prefixCls)

  const [wrapCSSVar, hashId, cssVarCls] = useStyle(prefixCls, rootCls)
  const wrapperClassNames = classNames(cssVarCls, rootCls, `${prefixCls}-wrapper`, className, hashId)
  const rootClassNames = classNames(cssVarCls, rootCls, `${prefixCls}-root`, className, hashId)

  // loading
  let spinProps: SpinProps | undefined = {}
  if (typeof loading === 'boolean') {
    spinProps = {
      spinning: loading,
    }
  } else if (typeof loading === 'object') {
    spinProps = {
      spinning: true,
      ...loading,
    }
  }

  const { changeEventInfo, triggerOnChange } = useEvents<RecordType>(finalProps)
  const { topPaginationNode, bottomPaginationNode } = useTablePagination<RecordType>({
    ...finalProps,
    changeEventInfo,
    triggerOnChange,
    prefixCls,
  })

  React.useImperativeHandle(ref, () => pipeline)

  return wrapCSSVar(
    <div className={rootClassNames}>
      {topPaginationNode}
      <div className={wrapperClassNames} style={mergedStyle}>
        <Spin spinning={false} {...spinProps}>
          <RcTable
            style={style}
            loading={spinProps.spinning}
            namespace={prefixCls}
            {...rest}
            className={classNames(cssVarCls, rootCls, hashId)}
            dataSource={dataSource}
            columns={columns}
          />
        </Spin>
      </div>
      {bottomPaginationNode}
    </div>
  )
}

export default React.forwardRef(InternalTable) as unknown as <RecordType extends AnyObject = AnyObject>(
  props: React.PropsWithChildren<InternalTableProps<RecordType>> & {
    ref?: React.Ref<TableRef>
  }
) => React.ReactElement
