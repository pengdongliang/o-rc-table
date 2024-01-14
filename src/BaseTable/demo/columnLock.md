---
title: 列锁定
order: 5
---

设置 column.fixed=true 即可锁列,锁定方向 取决于该列在 columns 中的下标：
- 下标为 0, 1, 2, ... 左侧锁定
- 下标为 n-1, n-2, n-3, ... 右侧锁定

```jsx
import React from "react";
import { Table, useTablePipeline, features } from "o-rc-table";

export default () => {
  const dataSource = [
    {id: "1", "No":1,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"29400.00","balance":"1000.00"},
    {id: "2", "No":2,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"},
    {id: "3", "No":3,"order":"HK-FDF-24785-02","from":"11111111","to":"2222222","amount":"249400.00","balance":"3000.00"},
    {id: "4", "No":4,"order":"AP-202009-00003","from":"11111111","to":"2222222","amount":"219400.00","balance":"4000.00"},
    {id: "5", "No":5,"order":"AP-202009-00004","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"}
  ]

  const footerDataSource = [
    {id: "5", "No":"合计","order":"AP-202009-00004","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"}
  ]

  const columns = [
    { dataIndex: 'No', name: '序号', width: 60, align: 'center', fixed: true, },
    { dataIndex: 'order', name: '单据号', width: 200},
    { dataIndex: 'from', name: '发货地', width: 200},
    { dataIndex: 'to', name: '收货地', width: 200},
    { dataIndex: 'amount', name: '应付金额', width: 100, align: 'right'},
    { dataIndex: 'balance', name: '应收余额', width: 100, align: 'right', fixed: true, }
  ]

  const pipeline = useTablePipeline().input({ dataSource: dataSource, columns: columns })
  return <Table  style={{ width: 800, height: 250,  overflow: 'auto' }} {...pipeline.getProps()}  footerDataSource={footerDataSource}/>
}
```
