import { genTable } from 'o-rc-table'

import type { InternalTableProps } from '../InternalTable'

/**
 * 修改触发器子级更新逻辑
 */
export default genTable((prev, next) => {
  const { _renderTimes: prevRenderTimes } = prev as InternalTableProps<any>
  const { _renderTimes: nextRenderTimes } = next as InternalTableProps<any>
  return prevRenderTimes !== nextRenderTimes
})
