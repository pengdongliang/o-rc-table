import { getTableClasses } from '@src/BaseTable'
import classNames from 'classnames'
import * as React from 'react'

export interface DefaultExpandIconProps<RecordType> {
  /** 命名空间 */
  Classes: ReturnType<typeof getTableClasses> | Record<string, any>
  /** 展开事件 */
  onExpand: (record: RecordType, e: React.MouseEvent<HTMLElement>) => void
  /** 行数据 */
  record: RecordType
  /** 展开状态 */
  expanded: boolean
  /** 是否可展开 */
  expandable: boolean
  /**
   * @description 是否对触发展开/收拢的 click 事件调用 event.stopPropagation()
   * @default true
   */
  stopClickEventPropagation?: boolean
  /** css style */
  style?: React.CSSProperties
}

export function renderExpandIcon<RecordType>({
  Classes,
  onExpand,
  record,
  expanded,
  expandable,
  stopClickEventPropagation,
  style,
}: DefaultExpandIconProps<RecordType>) {
  return (
    <button
      type="button"
      onClick={(e) => {
        onExpand?.(record, e)
        if (stopClickEventPropagation) {
          e.stopPropagation()
        }
      }}
      className={classNames(Classes?.expandIcon, {
        [Classes?.expandSpaced]: !expandable,
        [Classes?.expanded]: expandable && expanded,
        [Classes?.collapsed]: expandable && !expanded,
      })}
      style={style}
      aria-expanded={expanded}
    />
  )
}
