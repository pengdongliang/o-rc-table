---
title: 单元格合并
order: 601
---

通过 `column.getCellProps(...)` 返回 colSpan/rowSpan 可实现单元格合并。

除了 colSpan, rowSpan 之外，getCellProps 也可以返回 td 元素的其他 props，例如 className, style, onClick 等。
```jsx
import React from "react";
import { Table, useTablePipeline, features } from "o-rc-table";

export default () => {
   const dataSource = [
    {"No":1,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"29400.00","balance":"1000.00"},
    {"No":2,"order":"HK-FDF-24785-02","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"},
    {"No":3,"order":"AP-202009-00003","from":"11111111","to":"2222222","amount":"249400.00","balance":"3000.00"},
    {"No":4,"order":"AP-202009-00004","from":"11111111","to":"2222222","amount":"219400.00","balance":"4000.00"},
    {"No":5,"order":"AP-202009-00005","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"}
  ]

  const columns = [
    { code: 'No', name: '序号', width: 60, align: 'center'},
    { code: 'order', name: '单据号', width: 200,       
      getCellProps(value, record, rowIndex) {
        if (rowIndex === 1) {
          return {
            rowSpan: 2,
            colSpan: 2,
            style: { background: '#ffffff' },
          }
        }
      },
    },
    { code: 'from', name: '来户', width: 200 },
    { code: 'to', name: '往户', width: 200 },
    { code: 'amount', name: '应付金额', width: 100, align: 'right' },
    { code: 'balance', name: '应收余额', width: 100, align: 'right' }
  ]

  return <Table dataSource={dataSource} columns={columns} />
}
```
