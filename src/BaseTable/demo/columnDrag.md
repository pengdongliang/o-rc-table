---
title: 拖拽列排序
order: 303
---

设置ColumnDragOptions可以拖动表头来调整列的位置

用法:
pipeline.use(features.columnDrag())

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

  const _columns = [
    { dataIndex: 'No', name: '序号', width: 60, align: 'center' },
    { dataIndex: 'order', name: '物流编码', width: 200, features: { sortable: true, filterable: true }},
    { dataIndex: 'from', name: '发货地', width: 200, features: { sortable: true, filterable: true } },
    { dataIndex: 'to', name: '收货地', width: 200, features: { sortable: true, filterable: true } },
    { dataIndex: 'amount', name: '应付金额', width: 100, align: 'right', features: { sortable: true, filterable: true } },
    { dataIndex: 'balance', name: '应收余额', width: 100, align: 'right', features: { sortable: true, filterable: true } }
  ]

  const [columns, setColumns] = React.useState(_columns)

  const handleColumnDragStopped = (columnMoved, nextColumns) => {
     const columnSeq = nextColumns.reduce((result, col, colIndex) => {
        result[col.dataIndex] = colIndex
        return result
     }, {})

     setColumns(
       _columns.reduce((result, col) => {
          result[columnSeq[col.dataIndex]] = { ...col }
          return result
       }, [])
     )
  }

  const pipeline = useTablePipeline()
  .input({ dataSource: dataSource, columns: columns })
  .rowKey('id')
  .use(features.columnDrag({ onColumnDragStopped: handleColumnDragStopped }))

  return (
      <Table {...pipeline.getProps()} className="aaa" style={{ height: 200 }} />
  )
}
```
