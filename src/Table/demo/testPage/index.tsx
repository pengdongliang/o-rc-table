import { Table, TableRef } from '@table'
import { Button } from 'antd'
import { useMemo, useRef, useState } from 'react'
import KeepAlive, { AliveScope } from 'react-activation'

import dataSourceMock from './dataSourceMock.json'

export default () => {
  const tableRef = useRef<TableRef>()
  const [dataList] = useState<any>(dataSourceMock.data.list)
  // const [expKeys, setExpKeys]: any = useState([])

  const columns = useMemo(() => {
    let showDataList = []
    if (dataList[0]?.dailyDetailsResList && dataList[0]?.dailyDetailsResList.length) {
      showDataList = dataList[0]?.dailyDetailsResList
    }
    const dynamicList1 =
      dataList[0]?.demandDetailList?.map((res: any, i: any) => {
        return {
          title: `${res.startDate}(W${i})`,
          width: 150,
          render: (_text: any, row: any) => {
            return <>{row.demandDetailList[i].totalSalesQty || 0}</>
          },
        }
      }) || []
    const fixedList = [
      {
        title: '编码',
        dataIndex: 'materialCode',
        fixed: 'left',
        width: 80,
      },
      {
        title: '名称',
        dataIndex: 'materialName',
        width: 120,
      },
      {
        title: '组合',
        dataIndex: 'materialGroup',
        width: 120,
        children: [
          {
            title: '组1',
            dataIndex: 'materialGroup1',
            fixed: 'left',
            width: 100,
          },
          {
            title: '组2',
            dataIndex: 'materialGroup2',
            fixed: 'left',
            width: 100,
          },
        ],
      },
      ...dynamicList1,
      {
        title: '合计',
        dataIndex: 'totalDemandQty',
        width: 120,
      },
      {
        title: '数量',
        dataIndex: 'unclearStoQty',
        width: 120,
      },
      {
        title: '备注',
        dataIndex: 'remark',
        width: 120,
      },
      {
        title: '合计',
        width: 120,
        dataIndex: 'deliveryTotalQty',
      },
    ]
    const dynamicList =
      showDataList?.map((res: any, i: any) => {
        return {
          title: res.date,
          width: 150,
          render: (_text: any, row: any) => {
            return <>{row.dailyDetailsResList[i].qty || 0}</>
          },
        }
      }) || []
    return [
      ...fixedList,
      ...dynamicList,
      {
        title: '操作',
        dataIndex: 'opt',
        width: 200,
        fixed: 'right',
        render: () => {
          return (
            <>
              <Button color="blue" type="link">
                编辑
              </Button>
              <Button color="blue" type="link">
                删除
              </Button>
            </>
          )
        },
      },
    ]
  }, [dataList])

  const expandedRowRender = (record: any) => {
    let refDataList = []
    if (record?.refResList[0]?.dailyDetailsResList && record?.refResList[0]?.dailyDetailsResList.length) {
      refDataList = record?.refResList[0]?.dailyDetailsResList
    }
    const arr =
      refDataList?.map((res: any, index: number) => {
        return {
          title: res.date,
          width: 120,
          dataIndex: res.date,
          render: (_text: any, row: any) => {
            return <>{row?.dailyDetailsResList?.[index]?.qty || 0}</>
          },
        }
      }) || []

    return (
      <Table
        bordered
        columns={[
          {
            title: '编号',
            dataIndex: 'stoNo',
            width: 120,
            fixed: true,
          },
          {
            title: '类型',
            width: 80,
            fixed: true,
            dataIndex: 'replyType',

            render: (text: any) => {
              return <>{text?.desc}</>
            },
          },
          ...arr,
        ]}
        dataSource={record.refResList}
        pagination={false}
      />
    )
  }

  return (
    <AliveScope>
      <KeepAlive name="testProTable" cacheKey="testProTable" id="testProTable">
        <Table
          bordered
          prefixCls="pro-table"
          style={{ height: '500px' }}
          ref={tableRef}
          columns={columns}
          dataSource={dataSourceMock.data.list}
          expandable={{
            // expandedRowKeys: expKeys,
            // onExpand: (b: any, r: any) => {
            //   const newExp: any = b ? [...expKeys, r.id] : expKeys.filter((i: any) => i !== r.id)
            //   setExpKeys(newExp)
            // },
            expandedRowRender,
          }}
          // rowSelection={{
          //   onChange: (rowKeys, rows) => {
          //     console.info('rowSelection', rowKeys, rows)
          //   },
          // }}
        />
      </KeepAlive>
    </AliveScope>
  )
}
