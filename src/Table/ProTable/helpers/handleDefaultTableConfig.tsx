import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import React from 'react'
import { Observable } from 'rxjs'
import * as op from 'rxjs/operators'

import { defaultTableConfig } from '../config'
import type { RootSubjectType } from '../hooks/useRootSubject'

export interface HandleDefaultTableConfigProps<RecordType> {
  source$: Observable<RootSubjectType<RecordType>>
  expandedRowKeys: React.Key[]
  setExpandedRowKeys: React.Dispatch<React.SetStateAction<React.Key[]>>
}

/**
 * 默认antd表格配置处理
 */
export const handleDefaultTableConfig = <RecordType,>({
  source$,
  expandedRowKeys,
  setExpandedRowKeys,
}: HandleDefaultTableConfigProps<RecordType>) => {
  const finalExpandable = (props: RootSubjectType<RecordType>) => {
    const { responseDataHandler, rowKey, expandable } = props

    const { onExpand, expandedRowRender } = expandable ?? props
    let expandableObj: Partial<RootSubjectType<RecordType>> = {}

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
          onExpand: ((expanded: any, record: { [x: string]: React.Key }) => {
            if (expanded) {
              setExpandedRowKeys((v) => [...v, record?.[rowKey as string]])
            } else {
              const keys = expandedRowKeys?.reduce((p: React.Key[], c: React.Key) => {
                if (c !== record?.[rowKey as string]) {
                  p.push(c)
                }
                return p
              }, [])
              setExpandedRowKeys(keys)
            }
            if (typeof onExpand === 'function') onExpand(expanded, record)
          }) as RootSubjectType<RecordType>['expandable']['onExpand'],
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
  }

  const getSimpleConfig = (
    simple: RootSubjectType<RecordType>['simple'],
    containerNode: RootSubjectType<RecordType>['containerNode']
  ) => {
    if (simple) {
      return {
        serialNumber: false,
        showSearchBar: false,
        containerNode: containerNode ?? ('div' as RootSubjectType<RecordType>['containerNode']),
      }
    }
    return {}
  }

  return source$.pipe(
    op.map((props) => ({ ...defaultTableConfig, ...props })),
    op.map((props) => {
      const { simple, containerNode, scroll } = props
      const simpleConfig = getSimpleConfig(simple, containerNode)

      return {
        ...simpleConfig,
        ...props,
        ...(!containerNode && !simpleConfig.containerNode ? { scroll: { x: '100%', y: '100%', ...scroll } } : {}),
        ...finalExpandable(props),
      }
    })
  )
}
