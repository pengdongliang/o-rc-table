import { Pagination } from 'antd'
import usePagination from 'antd/es/table/hooks/usePagination'
import classNames from 'classnames'

import type { AnyObject } from '../../theme/interface'
import type { TablePaginationConfig } from '../interface'
import type { TableProps } from '../InternalTable'
import { useEvents } from './useEvents'

export function getPaginationParam(
  mergedPagination: TablePaginationConfig,
  pagination?: TablePaginationConfig | boolean
) {
  const param: any = {
    current: mergedPagination.current,
    pageSize: mergedPagination.pageSize,
  }

  const paginationObj = pagination && typeof pagination === 'object' ? pagination : {}

  Object.keys(paginationObj).forEach((pageProp) => {
    const value = mergedPagination[pageProp]

    if (typeof value !== 'function') {
      param[pageProp] = value
    }
  })

  return param
}

interface TablePaginationProps<RecordType extends AnyObject = AnyObject>
  extends TableProps<RecordType>,
    ReturnType<typeof useEvents> {}

/**
 * 处理表格分页
 */
export const useTablePagination = <RecordType extends AnyObject = AnyObject>(
  props: TablePaginationProps<RecordType>
) => {
  const { changeEventInfo, triggerOnChange, pagination, prefixCls, dataSource, size } = props

  const onPaginationChange = (current: number, pageSize: number) => {
    triggerOnChange(
      {
        pagination: { ...changeEventInfo.pagination, current, pageSize },
      },
      'paginate'
    )
  }

  const [mergedPagination, resetPagination] = usePagination(dataSource.length, onPaginationChange, pagination)

  changeEventInfo.pagination = pagination === false ? {} : getPaginationParam(mergedPagination, pagination)

  changeEventInfo.resetPagination = resetPagination

  // ============================ Render =============================
  let topPaginationNode: React.ReactNode
  let bottomPaginationNode: React.ReactNode
  if (pagination !== false && mergedPagination?.total) {
    let paginationSize: TablePaginationConfig['size']
    if (mergedPagination.size) {
      paginationSize = mergedPagination.size
    } else {
      paginationSize = size === 'small' || size === 'middle' ? 'small' : undefined
    }

    const renderPagination = (position: string) => {
      return (
        <Pagination
          {...mergedPagination}
          className={classNames(
            `${prefixCls}-pagination ${prefixCls}-pagination-${position}`,
            mergedPagination.className
          )}
          size={paginationSize}
        />
      )
    }
    const defaultPosition = 'right' // direction === 'rtl' ? 'left' : 'right'
    const { position } = mergedPagination
    if (position !== null && Array.isArray(position)) {
      const topPos = position.find((p) => p.includes('top'))
      const bottomPos = position.find((p) => p.includes('bottom'))
      const isDisable = position.every((p) => `${p}` === 'none')
      if (!topPos && !bottomPos && !isDisable) {
        bottomPaginationNode = renderPagination(defaultPosition)
      }
      if (topPos) {
        topPaginationNode = renderPagination(topPos.toLowerCase().replace('top', ''))
      }
      if (bottomPos) {
        bottomPaginationNode = renderPagination(bottomPos.toLowerCase().replace('bottom', ''))
      }
    } else {
      bottomPaginationNode = renderPagination(defaultPosition)
    }
  }

  return { topPaginationNode, bottomPaginationNode }
}
