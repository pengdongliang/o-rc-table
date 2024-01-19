---
title: 列宽拖拽
order: 301
---

表头右侧会出现可以拖动的竖线，用户可以拖拽来调整列宽

用法:
pipeline.use(features.columnResize())

```jsx
import React from "react";
import { Table, useTablePipeline, features } from 'baseTableDemo/demoUtil';

export default () => {
  const dataSource = [
    {
      id: "1",
      "No": 1,
      "order": "HK-FDF-24785-01",
      "from": "11111111",
      "to": "2222222",
      "amount": "29400.00",
      "balance": "1000.00"
    },
    {
      id: "2",
      "No": 2,
      "order": "HK-FDF-24785-01",
      "from": "11111111",
      "to": "2222222",
      "amount": "239400.00",
      "balance": "5000.00"
    },
    {
      id: "3",
      "No": 3,
      "order": "HK-FDF-24785-02",
      "from": "11111111",
      "to": "2222222",
      "amount": "249400.00",
      "balance": "3000.00"
    },
    {
      id: "4",
      "No": 4,
      "order": "AP-202009-00003",
      "from": "11111111",
      "to": "2222222",
      "amount": "219400.00",
      "balance": "4000.00"
    },
    {
      id: "5",
      "No": 5,
      "order": "AP-202009-00004",
      "from": "11111111",
      "to": "2222222",
      "amount": "239400.00",
      "balance": "5000.00"
    }
  ]

  const columns = [
    { dataIndex: 'No', name: '序号', width: 60, align: 'center' },
    { dataIndex: 'order', name: '物流编码', width: 200, features: { sortable: true, filterable: true } },
    { dataIndex: 'from', name: '发货地', width: 200, features: { sortable: true, filterable: true } },
    { dataIndex: 'to', name: '收货地', width: 200, features: { sortable: true, filterable: true } },
    {
      dataIndex: 'amount',
      name: '应付金额',
      width: 100,
      align: 'right',
      features: { sortable: true, filterable: true }
    },
    {
      dataIndex: 'balance',
      name: '应收余额',
      width: 100,
      align: 'right',
      features: { sortable: true, filterable: true }
    }
  ]

  const [columnSize, setColumnSize] = React.useState({})

  const pipeline = useTablePipeline()
    .input({ dataSource: dataSource, columns: columns })
    .rowKey('id')
    .use(features.columnResize(
      {
        maxSize: 200,
        columnSize,
        minSize: 100,
        onChangeSize: (e) => {
          setColumnSize(e)
        }
      }
    ))

  return (
    <Table {...pipeline.getProps()} className="aaa" style={{ height: 200 }} />
  )
}
```
