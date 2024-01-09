---
title: 多列排序
order: 22
---

可以通过指定`option.mode`支持多列排序。
<br/>
同时你可以设置 `column.features.sortable` 为一个函数来作为该列的排序比较函数。 

```jsx
import React from "react";
import { Table, useTablePipeline, features } from "o-rc-table";

export default () => {
  const [ sorts, setSorts ] = React.useState([{ code: 'order', order: 'desc' }])
  const dataSource = [
    {id: "1", "No":1,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"29400.00","balance":"1000.00"},
    {id: "2", "No":2,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"},
    {id: "3", "No":3,"order":"HK-FDF-24785-02","from":"11111111","to":"2222222","amount":"249400.00","balance":"3000.00"},
    {id: "4", "No":4,"order":"AP-202009-00003","from":"11111111","to":"2222222","amount":"219400.00","balance":"4000.00"},
    {id: "5", "No":5,"order":"AP-202009-00004","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"}
  ]

  const columns = [
    { code: 'No', name: '序号', width: 60, align: 'center' },
    { code: 'order', name: '单据号', width: 200, features: { sortable: true }},
    { code: 'from', name: '来户', width: 200, features: { sortable: true } },
    { code: 'to', name: '往户', width: 200, features: { sortable: true } },
    { code: 'amount', name: '应付金额', width: 100, align: 'right', features: { sortable: true } },
    { code: 'balance', name: '应收余额', width: 100, align: 'right', features: { sortable: true } }
  ]

  const handleSortsChanged = (nextSorts) => {
    console.log('nextSorts', nextSorts)
    setSorts(nextSorts)
  }

  const resetSorts = () => setSorts([])

  const pipeline = useTablePipeline({})
    .input({ dataSource, columns })
    .use(
      features.sort({
        mode: 'multiple',
        sorts,
        highlightColumnWhenActive: true,
        onChangeSorts: handleSortsChanged
      })
    )

    return <div style={{ height: 340}}>
        <button type="primary" onClick={resetSorts}>清除排序</button>
        <br/>
        <br/>
        <Table {...pipeline.getProps()} />
    </div>
}
```
