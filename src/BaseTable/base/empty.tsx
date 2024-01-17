import cx from 'classnames'
import { useBaseTableContext } from 'o-rc-table'
import React from 'react'

import { Colgroup } from './colgroup'
import { VisibleColumnDescriptor } from './interfaces'

const DefaultEmptyContent = React.memo(() => {
  const { Classes } = useBaseTableContext()

  return (
    <>
      <div className={Classes?.emptyImg}>
        <svg width="64" height="41" viewBox="0 0 64 41" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0 1)" fill="none" fillRule="evenodd">
            <ellipse fill="#f5f5f5" cx="32" cy="33" rx="32" ry="7" />
            <g fillRule="nonzero" stroke="#d9d9d9">
              <path d="M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z" />
              <path
                d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z"
                fill="#fafafa"
              />
            </g>
          </g>
        </svg>
      </div>
      <div className={Classes?.emptyDesc}>暂无数据</div>
    </>
  )
})

export interface EmptyTableProps {
  descriptors: VisibleColumnDescriptor[]
  loading: boolean
  emptyCellHeight?: number
  EmptyContent?: React.ComponentType
}

export function EmptyHtmlTable({
  descriptors,
  loading,
  emptyCellHeight,
  EmptyContent = DefaultEmptyContent,
}: EmptyTableProps) {
  const show = !loading

  const { Classes } = useBaseTableContext()

  return (
    <>
      <table key="table">
        <Colgroup descriptors={descriptors} />
        <tbody>
          <tr className={cx(Classes?.tableRow, Classes?.first, Classes?.last, 'no-hover')} data-rowindex={0}>
            {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
            <td
              className={cx(Classes?.tableCell, Classes?.first, Classes?.last)}
              colSpan={descriptors.length}
              style={{ height: emptyCellHeight ?? 200 }}
            />
          </tr>
        </tbody>
      </table>
      {show && (
        <div className={Classes?.emptyWrapper} key="empty">
          <EmptyContent />
        </div>
      )}
    </>
  )
}
