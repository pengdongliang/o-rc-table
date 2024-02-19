import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { useThemeContext } from '@ocloud/admin-context'
import type { AnyObject } from '@ocloud/antd'
import { useCreation } from 'ahooks'
import React, { useState } from 'react'

import { defaultTableConfig } from '../config'
import type { TableProps } from '../table'

/**
 * 默认antd表格配置处理
 * @param props
 */
export const useDefaultTableConfig = <RecordType extends AnyObject = AnyObject>(
  props: TableProps<RecordType>
): TableProps<RecordType> => {
  const { namespace } = useThemeContext()

  const finalProps = useCreation(() => {
    return {
      ...defaultTableConfig,
      ...props,
    }
  }, [props])
  const {
    responseDataHandler,
    containerNode,
    simple,
    rowKey,
    expandable,
    scroll,
    rowClassName,
    style: styleProp,
  } = finalProps
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const finalExpandable = useCreation<Pick<TableProps<RecordType>, 'expandable' | 'responseDataHandler'>>(() => {
    const { onExpand, expandedRowRender } = expandable ?? finalProps
    let expandableObj = {}
    if (typeof expandedRowRender === 'function' || typeof onExpand === 'function') {
      expandableObj = {
        expandable: {
          expandIcon: ({ expanded: internalExpanded, onExpand: internalOnExpand, record: internalRecord }) =>
            internalExpanded ? (
              <MinusOutlined onClick={(e) => internalOnExpand(internalRecord, e)} className="expand-icon" />
            ) : (
              <PlusOutlined onClick={(e) => internalOnExpand(internalRecord, e)} className="expand-icon" />
            ),
          expandedRowKeys,
          ...expandable,
          onExpand: ((expanded, record) => {
            if (expanded) {
              setExpandedRowKeys((v) => {
                v.push(record?.[rowKey as string])
                return v
              })
            } else {
              setExpandedRowKeys((v) => {
                const value = v?.reduce((p: React.Key[], c: React.Key) => {
                  if (c !== record?.[rowKey as string]) {
                    p.push(c)
                  }
                  return p
                }, [])
                return value
              })
            }
            if (typeof onExpand === 'function') onExpand(expanded, record)
          }) as TableProps<RecordType>['expandable']['onExpand'],
        },
        responseDataHandler: (data: Record<string, any>) => {
          let newData = data

          if (typeof responseDataHandler === 'function') {
            newData = responseDataHandler(data)
            if (Array.isArray(newData)) {
              newData = { list: newData }
            }
          }

          if (expandable?.defaultExpandAllRows) {
            setExpandedRowKeys(newData?.list?.map((i: Record<string, any>) => i?.[rowKey as string]))
          } else {
            setExpandedRowKeys([])
          }

          return newData
        },
      }
    }
    return expandableObj
  }, [expandable, expandedRowKeys, finalProps, responseDataHandler, rowKey])

  const simpleConfig = useCreation(() => {
    if (simple) {
      return {
        serialNumber: false,
        showSearchBar: false,
        containerNode: containerNode ?? ('div' as TableProps<RecordType>['containerNode']),
      }
    }
    return {}
  }, [simple, containerNode])

  const realProps = useCreation<TableProps<RecordType>>(() => {
    const style: { width?: string | number | boolean; height?: string | number | boolean } = styleProp ?? {}
    if (scroll?.x !== undefined) {
      style.width = scroll?.x
    }
    if (scroll?.y !== undefined) {
      style.height = scroll?.y
    }

    return {
      ...simpleConfig,
      ...finalProps,
      ...(!containerNode && !simpleConfig.containerNode
        ? { style: { width: scroll?.x ?? '100%', height: scroll?.y ?? '100%' } }
        : {}),
      style,
      ...finalExpandable,
      rowClassName: (record, index) => {
        const classList = [index % 2 === 0 ? `${namespace}-table-row_odd` : `${namespace}-table-row_even`]
        const propRowClassName = typeof rowClassName === 'string' ? rowClassName : rowClassName?.(record, index, null)
        if (propRowClassName) {
          classList.push(propRowClassName)
        }
        return classList.join(' ')
      },
    }
  }, [containerNode, finalExpandable, finalProps, scroll, simpleConfig])

  return realProps
}
