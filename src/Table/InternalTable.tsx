import { Spin, type SpinProps } from 'antd'
import { type ConfigConsumerProps, ConfigContext } from 'antd/es/config-provider'
import classNames from 'classnames'
import { useTablePipeline } from 'o-rc-table'
import type { BaseTableProps } from 'o-rc-table/base/table'
import * as React from 'react'

import useCSSVarCls from '../ConfigProvider/hooks/useCSSVarCls'
import type { AnyObject } from '../theme/interface'
import RcTable from './RcTable'
import useStyle from './style'

export type TableRef = ReturnType<typeof useTablePipeline>

export interface TableProps<RecordType = any> extends Omit<BaseTableProps<RecordType>, 'loading'> {
  prefixCls?: string
  className?: string
  style?: React.CSSProperties
  loading?: boolean | SpinProps
}

/** Same as `TableProps` but we need record parent render times */
export interface InternalTableProps<RecordType> extends TableProps<RecordType> {
  _renderTimes: number
}

const InternalTable = <RecordType extends AnyObject = AnyObject>(
  props: InternalTableProps<RecordType>,
  ref: React.Ref<TableRef>
) => {
  const { prefixCls: customizePrefixCls, className, style, dataSource, columns, loading, ...rest } = props

  const { getPrefixCls, table } = React.useContext<ConfigConsumerProps>(ConfigContext)

  const mergedStyle: React.CSSProperties = { ...table?.style, ...style }
  const prefixCls = getPrefixCls('table', customizePrefixCls)
  const rootCls = useCSSVarCls(prefixCls)

  const [wrapCSSVar, hashId, cssVarCls] = useStyle(prefixCls, rootCls)

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

  const wrapperClassNames = classNames(cssVarCls, rootCls, `${prefixCls}-wrapper`, className, hashId)

  const pipeline = useTablePipeline<RecordType>().input({ dataSource, columns })

  React.useImperativeHandle(ref, () => pipeline)

  return wrapCSSVar(
    <div className={wrapperClassNames} style={mergedStyle}>
      <Spin spinning={false} {...spinProps}>
        <RcTable
          style={style}
          loading={spinProps.spinning}
          namespace={prefixCls}
          {...rest}
          className={classNames(cssVarCls, rootCls, hashId)}
          {...pipeline.getProps()}
        />
      </Spin>
    </div>
  )
}

export default React.forwardRef(InternalTable) as unknown as <RecordType extends AnyObject = AnyObject>(
  props: React.PropsWithChildren<InternalTableProps<RecordType>> & {
    ref?: React.Ref<TableRef>
  }
) => React.ReactElement
