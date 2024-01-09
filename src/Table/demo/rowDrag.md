---
title: 行拖拽
order: 303
---

长按拖拽单元格，可以拖动行位置进行插入，插入位置会在拖拽过程中有蓝色线标注

用法:
pipeline.use(features.rowDrag())

[参数传送门](#rowDrag)

```jsx
import React from "react";
import { Table, useTablePipeline, features } from "o-rc-table";

export default () => {
  const defaultDataSource = [
    {id: "1", "No":1,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"29400.00","balance":"1000.00"},
    {id: "2", "No":2,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"},
    {id: "3", "No":3,"order":"HK-FDF-24785-02","from":"11111111","to":"2222222","amount":"249400.00","balance":"3000.00"},
    {id: "4", "No":4,"order":"AP-202009-00003","from":"11111111","to":"2222222","amount":"219400.00","balance":"4000.00"},
    {id: "5", "No":5,"order":"AP-202009-00004","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"}
  ]

  const columns = [
    { code: 'No', name: '序号', width: 60, align: 'center' },
    { code: 'order', name: '单据号', width: 200, features: { sortable: true, filterable: true }},
    { code: 'from', name: '来户', width: 200, features: { sortable: true, filterable: true } },
    { code: 'to', name: '往户', width: 200, features: { sortable: true, filterable: true } },
    { code: 'amount', name: '应付金额', width: 100, align: 'right', features: { sortable: true, filterable: true } },
    { code: 'balance', name: '应收余额', width: 100, align: 'right', features: { sortable: true, filterable: true } }
  ]


  const [dataSource, setDataSource] = React.useState(defaultDataSource)
  
  const pipeline = useTablePipeline()
  .input({ dataSource: dataSource, columns: columns })
  .primaryKey('id')
  .use(features.rangeSelection({
    rangeSelectedChange: function(cellRanges) {
      console.log('cellRanges', cellRanges)
    } // 范围选中回调
  }))
  .use(features.rowDrag())
  
  return (
    <Table {...pipeline.getProps()} />
  )
}
```
