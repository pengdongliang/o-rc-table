import type { FilterValue, SorterResult } from 'antd/es/table/interface'
import type { TablePipeline } from 'o-rc-table'

import type { AnyObject } from '../../theme/interface'
import { RCTABLEREF, type TableProps } from '../InternalTable'
import { FilterState } from './useFilter'
import { SortState } from './useSorter'

interface ChangeEventInfo<RecordType> {
  pagination: {
    current?: number
    pageSize?: number
    total?: number
  }
  filters: Record<string, FilterValue | null>
  sorter: SorterResult<RecordType> | SorterResult<RecordType>[]

  filterStates: FilterState<RecordType>[]
  sorterStates: SortState<RecordType>[]

  resetPagination: (current?: number, pageSize?: number) => void
}

const TableActions = ['paginate', 'sort', 'filter'] as const
export type TableAction = (typeof TableActions)[number]

export interface EventsProps<RecordType extends AnyObject = AnyObject> extends TableProps<RecordType> {
  pipeline: TablePipeline
}

/**
 * 处理事件
 */
export const useEvents = <RecordType extends AnyObject = AnyObject>(props: EventsProps<RecordType>) => {
  const { pagination, onChange, dataSource, pipeline } = props
  const changeEventInfo: Partial<ChangeEventInfo<RecordType>> = {}

  const triggerOnChange = (info: Partial<ChangeEventInfo<RecordType>>, action: TableAction, reset = false) => {
    const changeInfo = {
      ...changeEventInfo,
      ...info,
    }

    if (reset) {
      changeEventInfo.resetPagination?.()

      // Reset event param
      if (changeInfo.pagination?.current) {
        changeInfo.pagination.current = 1
      }

      // Trigger pagination events
      if (pagination && pagination.onChange) {
        pagination.onChange(1, changeInfo.pagination?.pageSize)
      }
    }

    // if (scroll && scroll.scrollToFirstRowOnChange !== false && internalRefs.body.current) {
    pipeline.getFeatureOptions(RCTABLEREF)?.scrollTo({ x: 0, y: 0 })
    // }

    onChange?.(changeInfo.pagination, changeInfo.filters, changeInfo.sorter, {
      currentDataSource: dataSource,
      action,
    })
  }

  return { changeEventInfo, triggerOnChange }
}
