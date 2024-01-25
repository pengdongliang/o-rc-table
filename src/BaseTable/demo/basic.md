---
title: 基本用法
order: 0
---

```jsx
import React from "react";
import { Table, useTablePipeline, features } from 'baseTableDemo/demoUtil';

export default () => {
  const dataSource = [
    {"No":1,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"29400.00","balance":"1000.00"},
    {"No":2,"order":"HK-FDF-24785-02","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"},
    {"No":3,"order":"AP-202009-00003","from":"11111111","to":"2222222","amount":"249400.00","balance":"3000.00"},
    {"No":4,"order":"AP-202009-00004","from":"11111111","to":"2222222","amount":"219400.00","balance":"4000.00"},
    {"No":5,"order":"AP-202009-00005","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"}
  ]

  const columns = [
    { dataIndex: 'No', name: '序号', width: 60, align: 'center', fixed: true },
    { dataIndex: 'order', name: '物流编码', width: 100, fixed: true, ellipsis: true },
    { dataIndex: 'from', name: '发货地', width: 200 },
    { dataIndex: 'to', name: '收货地', width: 200 },
    { dataIndex: 'amount', name: '应付金额', width: 100, align: 'right' },
    { dataIndex: 'balance', name: '应收余额', width: 100, align: 'right', fixed: true }
  ]

  const pipeline = useTablePipeline().input({ dataSource: dataSource, columns: columns })
  return <Table {...pipeline.getProps()} style={{ height: 500 }} />
}
```
