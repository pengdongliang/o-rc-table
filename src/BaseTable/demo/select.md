---
title: 行选择
order: 10
---

行选择：在每一行的左侧或右侧 渲染一个选择框，表示当前行是否被选中。

- 启用行多选功能之前，pipeline 必须已经设置了 `rowKey`
- 行多选依赖复选框组件，使用之前需要先设置 `pipeline.ctx.components.Checkbox`
- 行单选依赖单选组件，使用之前需要先设置 `pipeline.ctx.components.Radio`

参数传送门：

- [多选](#multiSelect)
- [单选](#singleSelect)

```jsx 
import React from 'react'
import { Table, useTablePipeline, features } from 'baseTableDemo/demoUtil'
import { Checkbox, Radio } from 'antd'

export default () => {
  const [selected, setSelected] = React.useState([])
  const [selectedType, setSelectedType] = React.useState('multi') //single or multi

  const handleSelectedTypeChange = e => {
    setSelected(selected.splice(0, 1))
    setSelectedType(e.target.value)
  }
  const handleChange = (v) => {
    setSelected(v)
  }

  const dataSource = [
    {
      id: '1',
      'No': 1,
      'order': 'HK-FDF-24785-01',
      'from': '11111111',
      'to': '2222222',
      'amount': '29400.00',
      'balance': '1000.00',
    },
    {
      id: '2',
      'No': 2,
      'order': 'HK-FDF-24785-02',
      'from': '11111111',
      'to': '2222222',
      'amount': '239400.00',
      'balance': '2000.00',
    },
    {
      id: '3',
      'No': 3,
      'order': 'AP-202009-00003',
      'from': '11111111',
      'to': '2222222',
      'amount': '249400.00',
      'balance': '3000.00',
    },
    {
      id: '4',
      'No': 4,
      'order': 'AP-202009-00004',
      'from': '11111111',
      'to': '2222222',
      'amount': '219400.00',
      'balance': '4000.00',
    },
    {
      id: '5',
      'No': 5,
      'order': 'AP-202009-00005',
      'from': '11111111',
      'to': '2222222',
      'amount': '239400.00',
      'balance': '2000.00',
    },
  ]

  const footerDataSource = [
    {
      id: '6',
      'No': '合计',
      'order': 'AP-202009-00004',
      'from': '11111111',
      'to': '2222222',
      'amount': '964,000.00',
      'balance': '18,900.00',
    },
  ]

  const columns = [
    { dataIndex: 'No', name: '序号', width: 60, align: 'center' },
    { dataIndex: 'order', name: '物流编码', width: 200 },
    { dataIndex: 'from', name: '发货地', width: 200 },
    { dataIndex: 'to', name: '收货地', width: 200 },
    { dataIndex: 'amount', name: '应付金额', width: 100, align: 'right' },
    { dataIndex: 'balance', name: '应收余额', width: 100, align: 'right' },
  ]

  const pipeline = useTablePipeline({
    components: {
      Checkbox: Checkbox,
      Radio: Radio,
    },
  })
    .input({ dataSource: dataSource, columns: columns })
    .rowKey('id')

  pipeline.use(features.footerDataSource({ dataSource: footerDataSource }))

  if (selectedType === 'multi') {
    pipeline.use(
      features.multiSelect({
        value: selected,
        onChange: (v)=> {
          setSelected(v)
        },
        highlightRowWhenSelected: true,
        clickArea: 'row',
        checkboxPlacement: 'start',
        checkboxColumn: { fixed: true },
      }),
    )
  } else {
    pipeline.use(
      features.singleSelect({
        value: selected[0],
        onChange: v => setSelected([v]),
        highlightRowWhenSelected: true,
        radioPlacement: 'start',
        radioColumn: { fixed: true },
      }),
    )
  }


  return (
    <div>
      <Radio.Group onChange={handleSelectedTypeChange} value={selectedType}>
        <Radio value={'multi'}>多选</Radio>
        <Radio value={'single'}>单选</Radio>
      </Radio.Group>
      <br />
      <Table
        {...pipeline.getProps()}
      />
    </div>
  )
}


```
