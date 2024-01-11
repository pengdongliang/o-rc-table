import classNames from 'classnames'
import { Table, useTablePipeline } from 'o-rc-table'
import type { BaseTableProps } from 'o-rc-table/base/table'
import * as React from 'react'

import { type ConfigConsumerProps, ConfigContext } from '../ConfigProvider'
import useCSSVarCls from '../ConfigProvider/hooks/useCSSVarCls'
import { AnyObject } from '../theme/interface'
import { RefInternalTable } from './interface'
import useStyle from './style'

export type TableRef = ReturnType<typeof useTablePipeline>

export interface TableProps<RecordType> extends BaseTableProps {
  prefixCls?: string
  className?: string
  style?: React.CSSProperties
}

/** Same as `TableProps` but we need record parent render times */
export interface InternalTableProps<RecordType> extends TableProps<RecordType> {
  _renderTimes: number
}

const InternalTable = <RecordType extends AnyObject = AnyObject>(
  props: InternalTableProps<RecordType>,
  ref: React.Ref<TableRef>
) => {
  const { prefixCls: customizePrefixCls, className, style, dataSource, columns } = props
  console.log(1111111, dataSource, columns)

  const { getPrefixCls } = React.useContext<ConfigConsumerProps>(ConfigContext)

  const prefixCls = getPrefixCls('table', customizePrefixCls)
  const rootCls = useCSSVarCls(prefixCls)

  const [wrapCSSVar, hashId, cssVarCls] = useStyle(prefixCls, rootCls)

  const wrapperClassNames = classNames(cssVarCls, rootCls, `${prefixCls}-wrapper`, className, hashId)

  const pipeline = useTablePipeline().input({ dataSource, columns })

  React.useImperativeHandle(ref, () => pipeline)

  console.log(22222222, wrapCSSVar(<div className={wrapperClassNames} style={style} />))

  return wrapCSSVar(
    <div className={wrapperClassNames} style={style}>
      <Table className={classNames(cssVarCls, rootCls, hashId)} {...pipeline.getProps()} />
    </div>
  )
}

export default React.forwardRef(InternalTable) as RefInternalTable
