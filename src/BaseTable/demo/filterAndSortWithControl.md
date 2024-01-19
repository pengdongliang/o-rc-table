---
title: 受控的过滤和排序
order: 21
---

使用 `sorts` 和 `filters` 属性，设置列的过滤和排序，这是一种`受控`的使用。排序和过滤之后字段列表会通过`onChangeSorts` 和`onFilterChanged` 返回，用户需要自己管理过滤和排序的字段列表。 

```jsx
import React from "react";
import { Table, useTablePipeline, features } from 'baseTableDemo/demoUtil';

export default () => {
  const [ sorts, setSorts ] = React.useState([{ dataIndex: 'order', order: 'asc' }])
  const [ filters, setFilters ] = React.useState([{dataIndex:'order',filter:'HK-FDF-24785-01',filterCondition:'contain'}])

  const dataSource = [
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

  const handleSortsChanged = (nextSorts) => {
    console.log('nextSorts', nextSorts)
    setSorts(nextSorts)
  }

  const handleFiltersChanged = (nextFilters) => {
    console.log('nextFilters', nextFilters)
    setFilters(nextFilters)
  }

  const pipeline = useTablePipeline()
  .input({ dataSource: dataSource, columns: columns })
  .use(
    features.sort({
      mode: 'single',
      sorts,
      highlightColumnWhenActive: true,
      sortIconHoverShow: true,
      onChangeSorts: handleSortsChanged
    })
  )
  .use(
    features.filter({
      filters,
      onChangeFilters:handleFiltersChanged        
    })
  )
  return <Table {...pipeline.getProps()} />
}
```


