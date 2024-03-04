---
title: 列宽充满
order: 303
---

1. 当需要一个或多个列来填充表格中的整个可用空间时，可以配置`column.features.flex`属性，设置了该属性的列将会按照弹性值的比例平分表格的剩余空间。
2. 当所有列未设置`flex`属性时，列的宽度将按照`column.width`属性的值进行比例分配, 默认分配特殊列(展开, 选择)。
3. 可以配置`column.features.flex = false` , 来关闭该特性。

> 注意：当同时设置了`columnResize`且该列宽被拖拽过大小时，该列的`flex`属性将不再生效


```jsx
import React from "react";
import { Table, useTablePipeline, features } from 'baseTableDemo/demoUtil';

export default () => {
  const dataSource = [
    {id: "1", "No":1,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"249400.00","balance":"1000.00"},
    {id: "2", "No":2,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"},
    {id: "3", "No":3,"order":"HK-FDF-24785-02","from":"11111111","to":"2222222","amount":"249400.00","balance":"3000.00"},
    {id: "4", "No":4,"order":"AP-202009-00003","from":"11111111","to":"2222222","amount":"219400.00","balance":"4000.00"},
    {id: "5", "No":5,"order":"AP-202009-00004","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"}
  ]

  const columns = [
    { dataIndex: 'No', name: '序号', width: 60, align: 'center' },
    { dataIndex: 'order', name: '物流编码', width: 200, },
    { dataIndex: 'from', name: '发货地', width: 200, features: { flex: 1, minWidth: 200, maxWidth: 300 } },
    { dataIndex: 'to', name: '收货地', width: 200, features: { flex: 2 } },
    { dataIndex: 'amount', name: '应付金额', width: 120, align: 'right' },
    { dataIndex: 'balance', name: '应收余额', width: 100, align: 'right' }
  ]

  const [columnSize, setColumnSize] = React.useState({})

    const pipeline = useTablePipeline()
    .input({ dataSource: dataSource, columns: columns })
    .rowKey('id')
    .use(features.columnResize(
      {
        columnSize,
        onChangeSize: (columnSize) => {
          setColumnSize(columnSize)
       }
      }
    ))

  return (
      <Table {...pipeline.getProps()} style={{ height: 200 }} />
  )
}
```
