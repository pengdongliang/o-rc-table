---
title: 过滤和排序
order: 20
---

通过设置表格属性 `feature.filter`来开启表格过滤功能，`filters` 或者 `defaultFilters` 属性来指定过滤字段列表，`onFilterChanged` 用于获得即将更新的过滤字段列表。对某一列可通过指定列的 `filterable` 属性可启动禁用该列的过滤功能，

通过设置表格属性 `feature.sort` 来开启排序功能， `sorts` 或者 `defaultSortOrder` 属性来指定排序字段列表，`onChangeSorts` 用于获得即将更新的排序字段列表。对某一列可通过指定列的 `sortable` 属性可启动禁用该列的排序功能，

使用 `defaultSortOrder` 和 `defaultFilters` 属性，设置列的默认排序顺序和列的默认过滤，这是一种`非受控`的使用。

> 树形数据排序时要注意 features.sort 的使用顺序（一般要在 features.treeMode 之前使用）。

配置项：
- [过滤](#filter)
- [排序](#sort)

```jsx
import React from "react";
import { Table, useTablePipeline, features } from 'baseTableDemo/demoUtil';

export default () => {
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
    const pipeline = useTablePipeline({})
    .input({ dataSource: dataSource, columns: columns })
    .use(
      features.sort({
        mode: 'single',
        defaultSorts: [{ dataIndex: 'order', order: 'asc' }],
        highlightColumnWhenActive: true,
        sortIconHoverShow: true,
        onChangeSorts: function (nextSorts) {
          console.log('nextSorts', nextSorts)
        }
      })
    )
    .use(
      features.filter({
        defaultFilters:[
           {
              dataIndex:'order',
              filter:'HK-FDF-24785-01',
              filterCondition:'contain'
           }
        ],
        onChangeFilters:function(nextFilters){
          console.log('nextFilters', nextFilters)
        }        
      })
    )
  return <Table {...pipeline.getProps()} />
}
```


