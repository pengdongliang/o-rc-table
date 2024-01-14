import { ConfigProvider } from 'antd'
import React from 'react'

import Table from '../Table'
import antdTheme from './antdTheme.json'

export default () => {
  const dataSource = React.useMemo(
    () =>
      Array.from(Array(10000)).map((_item, index) => ({
        id: index,
        No: index,
        order: `HK-FDF-24785-0${index}`,
        from: '11111111',
        to: '2222222',
        amount: '29400.00',
        balance: '1000.00',
        opt: `操作${index}`,
      })),
    []
  )

  const columns = React.useMemo(() => {
    const baseColumns = [
      { dataIndex: 'order', name: '物流编码', width: 200 },
      { dataIndex: 'from', name: '发货地', width: 200 },
      { dataIndex: 'to', name: '收货地', width: 200 },
      { dataIndex: 'amount', name: '应付金额', width: 100, align: 'right' },
      { dataIndex: 'balance', name: '应收余额', width: 100, align: 'right' },
    ]

    return Array.from(Array(2000))
      .reduce(
        (acc, _cur, index) =>
          acc.concat(
            baseColumns.map((item) => {
              return { ...item, name: item.name + index }
            })
          ),
        [{ dataIndex: 'No', name: '序号', width: 80, align: 'center', fixed: true }]
      )
      .concat({ dataIndex: 'opt', name: '操作', width: 80, align: 'center', fixed: true })
  }, [])

  // TODO 主题未应用需要看看ConfigProvider
  return (
    <ConfigProvider theme={antdTheme} prefixCls="ocloud">
      <Table
        dataSource={dataSource}
        columns={columns}
        bordered
        useVirtual
        style={{ height: 600, width: 800, overflow: 'auto' }}
      />
    </ConfigProvider>
  )
}
