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
      { code: 'order', name: '单据号', width: 200 },
      { code: 'from', name: '来户', width: 200 },
      { code: 'to', name: '往户', width: 200 },
      { code: 'amount', name: '应付金额', width: 100, align: 'right' },
      { code: 'balance', name: '应收余额', width: 100, align: 'right' },
    ]

    return Array.from(Array(2000))
      .reduce(
        (acc, _cur, index) =>
          acc.concat(
            baseColumns.map((item) => {
              return { ...item, name: item.name + index }
            })
          ),
        [{ code: 'No', name: '序号', width: 80, align: 'center', lock: true }]
      )
      .concat({ code: 'opt', name: '操作', width: 80, align: 'center', lock: true })
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
