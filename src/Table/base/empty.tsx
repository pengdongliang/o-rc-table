import cx from 'classnames'
import React from 'react'

import { Colgroup } from './colgroup'
import { VisibleColumnDescriptor } from './interfaces'
import { Classes } from './styles'

const DefaultEmptyContent = React.memo(() => (
  <>
    <img alt="empty-image" className="empty-image" src="//img.alicdn.com/tfs/TB1l1LcM3HqK1RjSZJnXXbNLpXa-50-50.svg" />
    <div className="empty-tips">
      没有符合查询条件的数据
      <br />
      请修改条件后重新查询
    </div>
  </>
))

export interface EmptyTableProps {
  descriptors: VisibleColumnDescriptor[]
  isLoading: boolean
  emptyCellHeight?: number
  EmptyContent?: React.ComponentType
}

export function EmptyHtmlTable({
  descriptors,
  isLoading,
  emptyCellHeight,
  EmptyContent = DefaultEmptyContent,
}: EmptyTableProps) {
  const show = !isLoading

  return (
    <>
      <table key="table">
        <Colgroup descriptors={descriptors} />
        <tbody>
          <tr className={cx(Classes.tableRow, Classes.first, Classes.last, 'no-hover')} data-rowindex={0}>
            <td
              className={cx(Classes.tableCell, Classes.first, Classes.last)}
              colSpan={descriptors.length}
              style={{ height: emptyCellHeight ?? 200 }}
            />
          </tr>
        </tbody>
      </table>
      {show && (
        <div className={Classes.emptyWrapper} key="empty">
          <EmptyContent />
        </div>
      )}
    </>
  )
}
