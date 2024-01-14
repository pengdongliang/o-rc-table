---
title: 虚拟列表
order: 33
---

数据量较大时，表格会自动开启虚拟滚动。你也可以通过表格的 [useVirtual](#虚拟滚动) 属性来调整虚拟滚动功能

> 注意设置表格的高度或最大高度（宽度同理），并设置 style.overflow = 'auto'

<br/>

```jsx 
import React from "react";
import { Table, useTablePipeline, features } from "o-rc-table";

export default () => {

  const data = React.useMemo(() => (
    Array.from(Array(100000)).map((item, index) => (
      {
        "id": index,
        "No": index,
        "order": "HK-FDF-24785-0" + index,
        "from": "11111111",
        "to": "2222222",
        "amount": "29400.00",
        "balance": "1000.00"
      }
    ))
  ), [])

  const baseColumns = [
    { dataIndex: 'order', name: '物流编码', width: 200 },
    { dataIndex: 'from', name: '发货地', width: 200 },
    { dataIndex: 'to', name: '收货地', width: 200 },
    { dataIndex: 'amount', name: '应付金额', width: 100, align: 'right' },
    { dataIndex: 'balance', name: '应收余额', width: 100, align: 'right' }
  ]
  const columns = React.useMemo(() => (
    Array.from(Array(10)).reduce((acc, cur, index) => (
      acc.concat(baseColumns.map(item => {
        return { ...item, name: item.name + index }
      }))
    ), [{ dataIndex: 'No', name: '序号', width: 60, align: 'center', fixed: true }])
  ), [])

  return (
    <Table
      style={{ height: 600, width: 800, overflow: 'auto' }}
      loading={false}
      dataSource={data}
      columns={columns}
    />
  )
}
```
