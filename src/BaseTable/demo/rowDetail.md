---
title: 行展开
order: 402
---

当表格内容较多不能一次性完全展示时，可设置行展开来展示。

[参数传送门](#rowDetail)
```jsx
import React from "react";
import { Table, useTablePipeline, features } from "o-rc-table";

export default () => {
  const dataSource = [
    {id:"1","No":1,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"29400.00","balance":"1000.00"},
    {id:"2","No":2,"order":"HK-FDF-24785-02","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"},
    {id:"3","No":3,"order":"AP-202009-00003","from":"11111111","to":"2222222","amount":"249400.00","balance":"3000.00"},
    {id:"4","No":4,"order":"AP-202009-00004","from":"11111111","to":"2222222","amount":"219400.00","balance":"4000.00"},
    {id:"5","No":5,"order":"AP-202009-00005","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"}
  ]

  const columns = [
    { dataIndex: 'No', name: '序号', width: 60, align: 'center' },
    { dataIndex: 'order', name: '物流编码', width: 200 },
    { dataIndex: 'from', name: '发货地', width: 200 },
    { dataIndex: 'to', name: '收货地', width: 200 },
    { dataIndex: 'amount', name: '应付金额', width: 100, align: 'right' },
    { dataIndex: 'balance', name: '应收余额', width: 100, align: 'right' }
  ]
  const pipeline = useTablePipeline()
  .input({ dataSource: dataSource, columns: columns })
  .rowKey('id')
  .use(
    features.rowDetail({
      defaultOpenKeys: ['2'],
      hasDetail(row) {
        return ['1', '2', '3'].includes(row.id)
      },
      renderDetail(row) {
        return (
          <div style={{ margin: '8px', textAlign: 'left' }}>
              <p>应付金额：{row.amount}</p>
              <p>应收余额：{row.balance}</p>
          </div>
        )
      },
    }),
  )
  return <Table {...pipeline.getProps()} />
}
```
