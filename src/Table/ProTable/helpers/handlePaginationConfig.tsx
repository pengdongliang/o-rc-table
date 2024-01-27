import { Observable } from 'rxjs'
import * as op from 'rxjs/operators'

import { defaultPaginationConfig } from '../config'
import type { TableProps } from '../table'

export interface UsePaginationConfigType<TData> {
  /** 初始化分页配置 */
  initPaginationConfig?: TableProps<TData>['pagination']
  /** 分页配置 */
  pagination?: TableProps<TData>['pagination']
}

/**
 * 分页配置数据
 */
export const handlePaginationConfig = <TData,>(
  source$: Observable<UsePaginationConfigType<TData>>,
  formatMessage: any
) => {
  return source$.pipe(
    op.map((props) => {
      const { initPaginationConfig = defaultPaginationConfig, pagination } = props

      return {
        ...props,
        paginationConfig: {
          ...defaultPaginationConfig,
          showQuickJumper: true,
          showSizeChanger: true,
          showTotal: (total: number) => formatMessage({ id: 'composition.totalNumberOfPagination' }, { total }),
          ...initPaginationConfig,
          ...(Object.prototype.toString.call(pagination).match(/^\[object\s(.*)\]$/)?.[1] === 'Object'
            ? pagination
            : {}),
        },
        paginationVisible: pagination === false || initPaginationConfig === false ? false : undefined,
      }
    })
  )
}
