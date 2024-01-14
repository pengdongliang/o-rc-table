---
title: 范围选中
order: 302
---

长按单元格，然后拖动会有一个范围选中的效果，可以通过rangeSelectedChange回调拿到范围选中的结果

支持单个单元格光标框选文字，框选范围超过单个单元格则显示范围选中效果

支持shift + 鼠标点击 框选范围

支持多范围框选， 按住control键进行框选时不会清掉之前的框选结果

[参数传送门](#rangeSelection)

用法:
pipeline.use(features.rangeSelection())

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
    { dataIndex: 'No', name: '序号', width: 60, align: 'center' },
    { dataIndex: 'order', name: '物流编码', width: 200, features: { sortable: true, filterable: true }},
    { dataIndex: 'from', name: '发货地', width: 200, features: { sortable: true, filterable: true } },
    { dataIndex: 'to', name: '收货地', width: 200, features: { sortable: true, filterable: true } },
    { dataIndex: 'amount', name: '应付金额', width: 100, align: 'right', features: { sortable: true, filterable: true } },
    { dataIndex: 'balance', name: '应收余额', width: 100, align: 'right', features: { sortable: true, filterable: true } }
  ]


  const [dataSource, setDataSource] = React.useState(defaultDataSource)
  
  const pipeline = useTablePipeline()
  .input({ dataSource: dataSource, columns: columns })
  .rowKey('id')
  .use(features.rangeSelection({
    rangeSelectedChange: function(cellRanges) {
      console.log('cellRanges', cellRanges)
    } // 范围选中回调
  }))
  
  return (
    <Table {...pipeline.getProps()} />
  )
}
```
