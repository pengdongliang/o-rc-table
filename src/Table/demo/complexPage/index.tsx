import { EditOutlined } from '@ant-design/icons'
import type { FormOptionsType } from '@ocloud/antd'
import { OAppContainer } from '@ocloud/antd'
import { ProTable, TableProps, TableRef } from '@table/ProTable'
import { Button, message, Space, Tag } from 'antd'
import { useMemo, useRef, useState } from 'react'

import dataSourceMock from './dataSourceMock.json'
import { useForecastDetails } from './hooks/useForecastDetails'
import storeList from './storeList.json'
import { TableStyle } from './styled'

const Ordered = () => {
  const tableRef = useRef<TableRef>(null)
  const [dataList, setDataList]: any = useState([])
  const [Lock] = useState(false)

  const { renderPopconfirm } = useForecastDetails()

  // 固定需求列表处理
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fixedDataListDeal = (List?: any, arr?: any) => {
    if (!List.length) return false
    if (!arr) return false
    const columns = [...arr]
    columns[8].children = List[0]?.fixedSalesResList?.map((res: any, index: any) => {
      return {
        title: (
          <div>
            <div>
              (w{index}){res.startDate.substr(0, 4)}.{res.weekNumber}
            </div>
            <div>
              {res.startDate.substr(5)}~{res.endDate.substr(5)}
            </div>
          </div>
        ),
        dataIndex: `totalSalesQty-${res?.id}`,
        width: 180,
        render: (_text: any, row: any) => {
          return (
            <div
              style={{ display: 'flex' }}
              className="system-title"
              title={`预测下单:${row?.fixedSalesResList[0]?.predictSales},火力池下单:${row.fixedSalesResList[0]?.dynamicPoolSales},借货:${row?.fixedSalesResList[0]?.borrowSales}`}
            >
              <div style={{ width: '70%' }}>
                <span style={{ color: row.fixedSalesResList[0]?.dynamicPoolSales > 0 ? '#6e87ee' : '' }}>
                  {row.fixedSalesResList[0].totalSalesQty}
                </span>
                /{row.fixedSalesResList[0].allowPlaceOrderSalesQty}
              </div>
              <div style={{ width: '30%', borderLeft: '1px solid #E7E7E7' }}>
                {row.fixedSalesResList[0].replenishQty}
              </div>
            </div>
          )
        },
        onCell: () => {
          return { className: 'fixed-style-yellow' }
        },
      }
    })
    const fixedColumns: any = dataList[0]?.lockSalesResList?.map((res: any, i: any) => {
      return {
        title: (
          <div>
            <div>
              (w{i + 1}){res.startDate.substr(0, 4)}.{res.weekNumber}
            </div>
            <div>
              {res.startDate.substr(5)}~{res.endDate.substr(5)}
            </div>
          </div>
        ),
        dataIndex: `predictSales-${res.id}`,
        width: 130,
        render: (_text: any, row: any) => {
          const editClsName = `predictSales-edit-${res.id}`
          const EditItem = (
            <EditOutlined
              onClick={(e) => {
                if (row.moq <= 0) return false
                renderPopconfirm({ row, index: i, event: e, children: EditItem, clsName: editClsName })
              }}
            />
          )

          return (
            <div
              style={{ display: 'flex' }}
              className="system-title"
              title={`预测下单:${row.lockSalesResList[i]?.predictSales},火力池下单:${row.lockSalesResList[i]?.dynamicPoolSales},借货:${row?.lockSalesResList[i]?.borrowSales}`}
            >
              <div style={{ width: '60%' }}>
                <span style={{ color: row.lockSalesResList[i]?.dynamicPoolSales > 0 ? '#6e87ee' : '' }}>
                  {row.lockSalesResList[i].totalSalesQty}
                </span>
                {!Lock && row.lockSalesResList[i].supportModifyFlag ? (
                  <span className={editClsName}>{EditItem}</span>
                ) : (
                  ''
                )}
              </div>
              <div style={{ width: '40%', borderLeft: '1px solid #E7E7E7' }}>
                {row.lockSalesResList[i].replenishQty}
              </div>
            </div>
          )
        },
        onCell: (_text: string, record: any) => {
          const className = `fixed-style-brown ${!record?.lockSalesResList[i]?.supportModifyFlag ? 'disable' : ''}`
          return { className }
        },
      }
    })
    // eslint-disable-next-line no-unsafe-optional-chaining
    columns[8].children = [...columns[8]?.children, ...fixedColumns]
    return columns
  }
  // 可变需求列表处理
  const variableDataListDeal = (list: any, arr: any) => {
    if (!list.length) return false
    if (!arr) return false
    const columns = [...arr]
    const fixedColumns: any = list[0]?.fickleSalesResList?.map((res: any, i: any) => {
      return {
        title: (
          <div>
            <div>
              (w{i + list[0].lockSalesResList.length + 1}){res.startDate.substr(0, 4)}.{res.weekNumber}
            </div>
            <div>
              {res.startDate.substr(5)}~{res.endDate.substr(5)}
            </div>
          </div>
        ),
        dataIndex: `predictSales-${res.id}-${i}`,
        width: 130,
        render: (_text: any, row: any) => {
          const clsName = `predictSales-edit-${res.id}-${i}`

          const EditItem = (
            <EditOutlined
              onClick={(e) => {
                if (row.moq <= 0) return false
                renderPopconfirm({
                  row,
                  index: i,
                  event: e,
                  fieldsNames: { listField: 'fickleSalesResList' },
                  children: EditItem,
                  clsName,
                })
              }}
            />
          )

          return (
            <>
              <div style={{ display: 'flex' }}>
                <div style={{ width: '60%' }}>
                  <span style={{ color: row.fickleSalesResList[i]?.dynamicPoolSales > 0 ? '#6e87ee' : '' }}>
                    {row.fickleSalesResList[i].totalSalesQty}
                  </span>
                  {row?.fickleSalesResList[i]?.supportModifyFlag ? <span className={clsName}>{EditItem}</span> : ''}
                </div>
                <div style={{ width: '40%', borderLeft: '1px solid #E7E7E7' }}>
                  {row.fickleSalesResList[i].replenishQty}
                </div>
              </div>
            </>
          )
        },
        onCell: (_text: string, record: any) => {
          const className = `${!record?.fickleSalesResList[i]?.supportModifyFlag ? 'disable' : ''}`
          return { className }
        },
      }
    })
    columns[9].children = fixedColumns
    return columns
  }
  const columns: TableProps['columns'] = useMemo(() => {
    const arr = [
      {
        title: '序号',
        render: (_text: any, _row: any, index: any) => {
          return <>{index + 1}</>
        },
        fixed: 'left',
        align: 'center',
        width: 60,
      },
      {
        title: '店铺',
        render: (_text: any, row: any) => {
          const storeName = storeList.filter((res: any) => res.code === row.storeCode)
          return <>{storeName[0]?.name}</>
        },
        fixed: 'left',
        width: 120,
        dataIndex: 'storeName',
        ellipsis: {
          showTitle: true,
        },
      },
      {
        title: '物料编码',
        dataIndex: 'materialCode',
        width: 120,
        fixed: 'left',
        ellipsis: {
          showTitle: true,
        },
      },
      {
        title: '物料名称',
        dataIndex: 'materialName',
        width: 160,
        fixed: 'left',
        ellipsis: {
          showTitle: true,
        },
      },
      {
        title: '未清STO数',
        dataIndex: 'unclearedStoQty',
        width: 90,
        fixed: 'left',
        ellipsis: {
          showTitle: true,
        },
      },
      {
        title: '产品信息',
        children: [
          {
            title: '物料采购类型',
            dataIndex: 'purchaseType',
            width: 150,
            ellipsis: {
              showTitle: true,
            },
          },
          {
            title: 'sku',
            dataIndex: 'skus',
            width: 150,
            ellipsis: {
              showTitle: true,
            },
          },
          {
            title: 'MOQ',
            dataIndex: 'moq',
            width: 80,
            ellipsis: {
              showTitle: true,
            },
          },
          {
            title: '整箱数',
            dataIndex: 'fullBoxQty',
            width: 80,
            render: (_text: any, row: any) => {
              return <>{row.fullBoxQty || '0'}</>
            },
          },
          {
            title: '新/老品',
            dataIndex: 'newArrivalsFlag',
            width: 80,
            render: (_text: any, row: any) => {
              return <>{row.newArrivalsFlag === true ? '新品' : row.newArrivalsFlag === false ? '老品' : '未知'}</>
            },
          },
          {
            title: '销售类型',
            dataIndex: 'limitedEditionFlag',
            width: 80,
            render: (_text: any, row: any) => {
              return <>{row.limitedEditionFlag ? '限量' : '常规'}</>
            },
          },
        ],
      },
      {
        title: '',
        children: [
          {
            title: '最小交货日期(天)',
            dataIndex: 'deliveryPeriod',
            width: 120,
          },
          {
            title: '上市月份',
            dataIndex: 'listingMonth',
            width: 100,
          },
          {
            title: '是否有成本价',
            dataIndex: 'costPriceFlag',
            render: (_text: any, row: any) => {
              return <>{row.costPriceFlag ? '有成本价' : '无成本价'}</>
            },
            width: 100,
          },
        ],
      },
      {
        title: '库存及销售数据',
        children: [
          {
            title: '成品在库',
            dataIndex: 'finishedInStock',
            width: 100,
          },
          {
            title: '已发在途',
            dataIndex: 'shippedInTransit',
            width: 100,
          },
          {
            title: '库存可售周数',
            dataIndex: 'inventoryAvailableWeeks',
            width: 100,
          },
          {
            title: '12周周均销量',
            dataIndex: 'weeksAverageSales',
            width: 100,
          },
          {
            title: '上周销量',
            dataIndex: 'lastWeekSales',
            width: 100,
          },
          {
            title: '预测模型周均销量',
            dataIndex: 'predictModelWeeksAverageSales',
            width: 100,
          },
          {
            title: '预测系数',
            dataIndex: 'predictCoefficient',
            width: 100,
          },
        ],
      },
      {
        title: '固定需求',
        children: [],
      },
      {
        title: '可变预测',
        children: [],
      },
    ]
    return variableDataListDeal(dataList, fixedDataListDeal(dataList, arr)) || []
  }, [dataList, fixedDataListDeal])
  // 手动刷新
  const manuallyRefresh = () => {}
  // 手动预测
  const manualForecast = () => {}
  // 下单预览
  const orderPreview = () => {}

  const useTableForm = useMemo<FormOptionsType>(() => {
    return {
      itemCount: {
        xxxl: 5,
        xxl: 4,
        xl: 3,
        lg: 2,
        l: 1,
      },
      searchText: '筛选',
      formItemOptions: [
        {
          name: 'storeCode',
          formItemProps: { label: '店铺' },
          itemName: 'select',
          itemProps: {
            fieldNames: { label: 'name', value: 'code' },
            options: storeList,
            allowClear: false,
            optionFilterProp: ['name', 'code'],
            onChange: (val: string) => {
              if (val || val === '') {
                tableRef?.current?.search.submit()
              }
            },
          },
        },
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
          itemName: 'input',
          formItemProps: { label: '物料名称' },
        },
        {
          name: 'purchaseType',
          formItemProps: { label: '采购对应类型' },
          itemName: 'select',
          itemProps: {
            fieldNames: { label: 'label', value: 'id' },
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
            optionFilterProp: ['label', 'id'],
          },
        },
        {
          name: 'listingMonth',
          itemName: 'datePicker',
          formItemProps: { label: '上市月份' },
        },
      ],
      formItemAppendNodes: (
        <Tag style={{ marginLeft: '10px' }} color="success">
          未超红线
        </Tag>
      ),
    }
  }, [])

  const optItems = useMemo(() => {
    return (
      <Space>
        <Button type="default" onClick={manuallyRefresh}>
          手动刷新
        </Button>
        <Button type="default" onClick={orderPreview}>
          下单预览
        </Button>
        <Button type="default">调整需求</Button>
        <Button type="default">调整需求列表</Button>
        <Button
          type="primary"
          onClick={() => {
            manualForecast()
          }}
        >
          手动预测
        </Button>
        <Button
          type="primary"
          onClick={() => {
            if (!Lock) {
              message.warning('当前店铺已经处于解锁状态!')
              return false
            }
          }}
        >
          解锁
        </Button>
        <Button
          color="red"
          type="primary"
          onClick={() => {
            if (Lock) {
              message.warning('当前店铺已经锁定!')
              return false
            }
          }}
        >
          锁定
        </Button>
      </Space>
    )
  }, [Lock])

  return (
    <OAppContainer>
      <TableStyle formItemOptions={useTableForm?.formItemOptions}>
        <ProTable
          proTable
          containerNode="div"
          style={{ height: '500px' }}
          initPaginationConfig={{ pageSize: 500 }}
          autoVirtualThreshold={50}
          ref={tableRef}
          columns={columns}
          serialNumber={false}
          rowKey="materialCode"
          dataSource={dataList}
          useTableForm={useTableForm}
          request={(options) => {
            return new Promise((resolve) => {
              setTimeout(() => {
                const newDataList = { data: { list: JSON.parse(JSON.stringify(dataSourceMock)) as any, total: 5430 } }
                const { materialCodes } = options?.params ?? {}
                // const firstData = newDataList.data.list.splice(0, 5)
                // newDataList.data.list = firstData
                // newDataList.data.list = firstData.concat(newDataList.data.list.sort(() => Math.random() - 0.5))
                if (materialCodes) {
                  const findItem = newDataList.data.list.find((i: any) => i?.materialCode?.includes(materialCodes))
                  newDataList.data.list = [findItem]
                }
                resolve(newDataList)
              }, 300)
            })
          }}
          responseDataHandler={(list: any) => {
            const resDataList = list?.list || list
            const result = resDataList?.map((res: any) => {
              res.lockSalesResList = res.lockSalesResList.map((data: any) => {
                return { ...data, popoverState: false, supportModifyFlag: true }
              })
              res.fickleSalesResList = res.fickleSalesResList.map((data: any) => {
                return { ...data, popoverState: false }
              })
              return res
            })
            setDataList(JSON.parse(JSON.stringify(result)))
            return list
          }}
          requestParamsHandler={(searchParams: any, formData: any) => {
            return { searchParams, formData: { ...formData } }
          }}
        >
          {optItems}
        </ProTable>
      </TableStyle>
    </OAppContainer>
  )
}
export default Ordered
