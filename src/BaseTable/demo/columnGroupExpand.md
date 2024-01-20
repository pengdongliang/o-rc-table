---
title: 列分组展开收起
order: 401
---

在 `columns.children=[...]` 中添加子节点，`<Table />` 会绘制相应的嵌套表头结构。

```jsx
import React from 'react'
import { Table, useTablePipeline, features, proto } from 'baseTableDemo/demoUtil'

export default () => {
  const occupations = ['UED', '客服', '产品', '运营', '前端', '数据']
  const dataSource = occupations.map((occupation) => ({
    occupation,
    hc_2014: 104,
    hc_2015: 168,
    hc_lfl: 50,
    age_2014: 30,
    age_2015: 32,
    age_lfl: 15,
    rate_2014_0: 0.3,
    rate_2014_1: 0.3,
    rate_2015_0: 0.45,
    rate_2015_1: 0.45,
    rate2_2014: 0.33,
    rate2_2015: 0.48,
  }))
  const [expandStatus, setExpandStatus] = React.useState({ personTotal: true })
  const col = proto.array({
    align: 'center',
    width: 80,
    onHeaderCell: () => ({ style: { textAlign: 'center', padding: 0 } }),
  })
  const columns = col([
    { fixed: true, dataIndex: 'occupation', name: '职务', width: 120 },
    {
      name: '人数',
      dataIndex: 'personTotal',
      features: {
        showExtendIcon: true,
      },
      children: col([
        { dataIndex: 'hc_2014', name: '2014年' },
        { dataIndex: 'hc_2015', name: '2015年' },
        { dataIndex: 'hc_lfl', name: '同比增长' }]),
    },
    {
      name: '年龄',
      dataIndex: 'age',
      children: col([
        { dataIndex: 'age_2014', name: '2014年' },
        { dataIndex: 'age_2015', name: '2015年' },
        { dataIndex: 'age_lfl', name: '同比增长' },
      ]),
    },
    {
      name: '占比',
      dataIndex: 'percent',
      children: col([
        { dataIndex: 'rate_2014_0', name: '2014年' },
        { dataIndex: 'rate_2015_0', name: '2015年' },
      ]),
    },
    {
      name: '占比2',
      dataIndex: 'percent_02',
      children: col([
        { dataIndex: 'rate_2014_1', name: '2014年' },
        { dataIndex: 'rate_2015_1', name: '2015年' },
      ]),
    },
  ])
  const onChangeExtendStatus = (curStatus, changeValue) => {
    setExpandStatus(curStatus)
  }
  const pipeline = useTablePipeline({})
    .input({ dataSource: dataSource, columns: columns })
    // .use(features.columnRangeHover())
    .use(features.columnResize())
    .use(features.colGroupExtendable(
      {
        extendStatus: expandStatus,
        onChangeExtendStatus: onChangeExtendStatus,
      },
    ))
  return <Table className="bordered" {...pipeline.getProps()} />
}
```
