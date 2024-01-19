---
title: 自动合并多行
order: 601
---

在设置 `column.features.autoRowSpan` 之后，如果该列中相连的两个单元格的值相等，则自动合并这两个单元格。如果连续的多个单元格的值都相等，则合并这些单元格。 

`column.features.autoRowSpan` 也可以设置为一个比较函数，用来自定义「两个单元格中的值相等」的判断逻辑。其函数签名为 `(v1: any, v2: any. row1: any, row2: any) => boolean`

注意: autoRowSpan 会覆盖原有的 `column.getSpanRect`，注意避免冲突。

```jsx
import React from "react";
import { Table, useTablePipeline, features } from 'baseTableDemo/demoUtil';

export default () => {
  const dataSource = [
    {"No":1,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"29400.00","balance":"1000.00"},
    {"No":2,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"},
    {"No":3,"order":"HK-FDF-24785-02","from":"11111111","to":"2222222","amount":"249400.00","balance":"3000.00"},
    {"No":4,"order":"AP-202009-00003","from":"11111111","to":"2222222","amount":"219400.00","balance":"4000.00"},
    {"No":5,"order":"AP-202009-00004","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"}
  ]

  const columns = [
    { dataIndex: 'No', name: '序号', width: 60, align: 'center' },
    { dataIndex: 'order', name: '物流编码', width: 200, features: { autoRowSpan: true}},
    { dataIndex: 'from', name: '发货地', width: 200 },
    { dataIndex: 'to', name: '收货地', width: 200 },
    { dataIndex: 'amount', name: '应付金额', width: 100, align: 'right' },
    { dataIndex: 'balance', name: '应收余额', width: 100, align: 'right' }
  ]

    const pipeline = useTablePipeline({})
    .input({ dataSource: dataSource, columns: columns })
    .use(
      features.autoRowSpan()
    )
  return <Table {...pipeline.getProps()} />
}
```
