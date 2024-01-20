import type { FormOptionsType, TableRef } from '@ocloud/antd'
import { Button, OAppContainer } from '@ocloud/antd'
import antdTheme from '@table/demo/antdTheme.json'
import { ProTable } from '@table/ProTable'
import { useMemo, useRef, useState } from 'react'

import dataSourceMock from './dataSourceMock.json'

/**
 *
 * @param 需要转换的json数据
 * @returns
 */
export function getUrlpar(data: any) {
  if (!data) return ''
  let params: any = Object.keys(data).map((key) => {
    if ((data[key] === '' || !data[key]) && data[key] !== 0 && data[key] !== false) {
      return null
    }
    return `${key}=${data[key]}`
  })
  params = params.filter((res: any) => res).join('&')
  return params
}

// 过滤清楚空格,回车替换成,号
export function filterData(item: any) {
  let data = item
  if (data) {
    data = data.replace(/ +/g, '')
    data = data.replace(/,/g, '')
    data = data.replace(/\r+|\n+/g, ',')
  }
  return data || undefined
}

const STOSingleProductionDeliveryPlan = () => {
  const tableRef = useRef<TableRef>()
  const [dataList, setDataList] = useState<any>([])
  const [expKeys, setExpKeys]: any = useState([])

  const columns = useMemo(() => {
    // 截取前80，解决卡顿问题
    let showDataList = []
    if (dataList[0]?.dailyDetailsResList && dataList[0]?.dailyDetailsResList.length) {
      showDataList = dataList[0]?.dailyDetailsResList // .slice(0, 80)
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
        title: '物料编码',
        dataIndex: 'materialCode',
        fixed: 'left',
        width: 120,
      },
      {
        title: '物料名称',
        dataIndex: 'materialName',
        width: 120,
      },
      {
        title: '物料组',
        dataIndex: 'materialGroup',
        width: 120,
      },
      {
        title: '采购类型',
        dataIndex: 'purchaseType',
        width: 120,
      },
      ...dynamicList1,
      {
        title: '需求合计',
        dataIndex: 'totalDemandQty',
        width: 120,
      },
      {
        title: '未清STO数量',
        dataIndex: 'unclearStoQty',
        width: 120,
      },
      {
        title: '库存数量',
        dataIndex: 'stockQty',
        width: 120,
      },
      {
        title: '在制数量',
        dataIndex: 'inProductionQty',
        width: 120,
      },
      {
        title: '在途数量',
        dataIndex: 'inTransitQty',
        width: 120,
      },
      {
        title: '待质检数量',
        dataIndex: 'waitInspectionQty',
        width: 120,
      },
      {
        title: '周欠货数量',
        dataIndex: 'weekOutOfStockQty',
        width: 120,
      },
      {
        title: '物料版本',
        width: 120,
        render: (_text: any, row: any) => {
          return <>{row?.materialSalesType?.desc}</>
        },
      },
      {
        title: '备注',
        dataIndex: 'remark',
        width: 120,
      },
      {
        title: '交付合计',
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
        width: 320,
        fixed: 'right',
        render: () => {
          return (
            <>
              <Button color="blue" type="link">
                修改备注
              </Button>
              <Button color="blue" type="link">
                修改备注
              </Button>
              <Button color="blue" type="link">
                修改备注
              </Button>
              <Button color="blue" type="link">
                修改备注
              </Button>
              <Button color="blue" type="link">
                修改备注
              </Button>
            </>
          )
        },
      },
    ]
  }, [dataList])

  const useTableForm = useMemo<FormOptionsType>(() => {
    return {
      formItemOptions: [
        {
          name: 'materialCodes',
          formItemProps: { label: '物料编码' },
          itemName: 'inputTextArea',
          itemProps: {
            placeholder: '支持多行查询',
          },
        },
        {
          name: 'materialName',
          formItemProps: { label: '物料名称' },
          itemName: 'input',
        },
        {
          name: 'stoNo',
          formItemProps: { label: '单号' },
          itemName: 'input',
        },
        {
          name: 'purchaseType',
          formItemProps: { label: '采购类型' },
          itemName: 'select',
          itemProps: {
            fieldNames: { label: 'label', value: 'id' },
            optionFilterProp: ['label', 'id'],
            options: [
              {
                label: '2000-自产',
                id: '2000-自产',
              },
              {
                label: '4000-非自产',
                id: '4000-非自产',
              },
              {
                label: '4010-刀刀',
                id: '4010-刀刀',
              },
              {
                label: '4010-非自产',
                id: '4010-非自产',
              },
              {
                label: '3040-非自产',
                id: '3040-非自产',
              },
            ],
          },
        },
        {
          name: 'materialSalesType',
          formItemProps: { label: '物料版本' },
          itemName: 'select',
          itemProps: {
            fieldNames: { label: 'label', value: 'id' },
            optionFilterProp: ['label', 'id'],
            options: [
              {
                label: '常规',
                id: 'REGULAR',
              },
              {
                label: '限量',
                id: 'LIMITED',
              },
              {
                label: '一次性常规版',
                id: 'DISPOSABLE_REGULAR',
              },
            ],
          },
        },
      ],
      formItemAppendNodes: (
        <>
          <Button type="default">导出</Button>
        </>
      ),
    }
  }, [])

  const expandedRowRender = (record: any) => {
    // 截取前80，解决卡顿问题
    let refDataList = []
    if (record?.refResList[0]?.dailyDetailsResList && record?.refResList[0]?.dailyDetailsResList.length) {
      refDataList = record?.refResList[0]?.dailyDetailsResList // .slice(0, 80)
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
      <ProTable
        columns={[
          {
            title: '单号',
            dataIndex: 'stoNo',
            width: 160,
            fixed: 'left',
          },
          {
            title: '单据类型',
            width: 160,
            fixed: 'left',
            dataIndex: 'replyType',

            render: (text: any) => {
              return <>{text?.desc}</>
            },
          },
          ...arr,
        ]}
        dataSource={record.refResList}
        containerNode="div"
        showSearchBar={false}
        pagination={false}
        style={{ width: '1000px' }}
      />
    )
  }

  return (
    <OAppContainer
      theme={{
        theme: {
          antdTheme,
          namespace: 'ocloud',
          breakPoint: {},
          colors: {
            white: '',
            black: '',
            primary: '',
          },
        },
      }}
    >
      <ProTable
        proTable
        containerNode="div"
        style={{ height: '500px' }}
        initPaginationConfig={{ pageSize: 500 }}
        ref={tableRef}
        columns={columns}
        useTableForm={useTableForm}
        request={() => {
          return new Promise((resolve) => {
            setTimeout(() => {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              const firstData = dataSourceMock.data.list.splice(0, 1)
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              dataSourceMock.data.list = firstData.concat(dataSourceMock.data.list.sort(() => Math.random() - 0.5))
              resolve(dataSourceMock)
            }, 300)
          })
        }}
        responseDataHandler={(data: any) => {
          setDataList(data?.list)
          return data
        }}
        requestParamsHandler={(searchParams, formData) => {
          return {
            searchParams,
            formData: { ...formData, materialCodes: filterData(formData?.materialCodes) },
          }
        }}
        expandable={{
          expandedRowKeys: expKeys,
          onExpand: (b: any, r: any) => {
            const newExp: any = b ? [...expKeys, r.id] : expKeys.filter((i: any) => i !== r.id)
            setExpKeys(newExp)
          },
          expandedRowRender,
        }}
      />
    </OAppContainer>
  )
}
export default STOSingleProductionDeliveryPlan