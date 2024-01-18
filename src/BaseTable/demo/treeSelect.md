---
title: 树形选择
order: 222
---

在树状模式的基础上支持复选功能。功能可以参考 [antd 组件库中的 `<TreeSelect />` 组件](https://ant-design.gitee.io/components/tree-select-cn/)。

[参数传送门](#treeSelect)

```jsx
import React from "react";
import { Table, useTablePipeline, features, collectNodes, isLeafNode } from "o-rc-table";
import { Checkbox } from "antd";

export default () => {
  function renderOptions() {
    return (
      <div style={{ display: 'flex' }}>
        <div style={{ marginRight: '5px', cursor: 'pointer', color: '#5582F3' }}>编辑</div>
        <div style={{ cursor: 'pointer', color: '#fb2323' }}>删除</div>
      </div>
    )
  }

  function makeChildren(prefix) {
    return [
      {
        id: `${prefix}-1`,
        title: '二级标题',
        dept: '应用部',
        dest: '云南大理',
        guide: 'Douglas Lee',
        children: [
          { id: `${prefix}-1-1`, title: '三级标题', dept: '平台大前端-UED', dest: '云南大理', guide: 'Douglas Lee' },
          { id: `${prefix}-1-2`, title: '三级标题', dept: '平台大前端-前端', dest: '云南大理', guide: 'Douglas Lee' },
        ],
      },
      {
        id: `${prefix}-2`,
        title: '二级标题',
        dept: '应用部',
        dest: '云南大理',
        guide: 'Douglas Lee',
        children: [
          { id: `${prefix}-2-1`, title: '三级标题', dept: '平台大前端-UED', dest: '云南大理', guide: 'Douglas Lee' },
          { id: `${prefix}-2-2`, title: '三级标题', dept: '平台大前端-前端', dest: '云南大理', guide: 'Douglas Lee' },
        ],
      },
      { id: `${prefix}-3`, title: '二级标题', dept: '应用部', dest: '云南大理', guide: 'Douglas Lee' },
    ]
  }

  const dataSource = [
    {
      id: '1',
      title: '一级标题',
      dept: '云苍穹-前端',
      dest: 'South Maddison',
      guide: 'Don Moreno',
      children: makeChildren('1'),
    },
    {
      id: '2',
      title: '一级标题',
      dept: '云苍穹-模型',
      dest: 'Emilhaven',
      guide: 'Douglas Richards',
      children: makeChildren('2'),
    },
    {
      id: '3',
      title: '一级标题',
      dept: '云苍穹-基础',
      dest: '云南大理',
      guide: 'Douglas Lee',
      children: makeChildren('3'),
    },
    {
      id: '4',
      title: '一级标题',
      dept: '云苍穹-体验',
      dest: '杭州千岛湖',
      guide: 'Eric Castillo',
      children: makeChildren('4'),
    },
    { id: '5', title: '一级标题', dept: '云苍穹-运营', dest: 'East Karl', guide: 'Herbert Patton' }
  ]
  const columns = [
    { dataIndex: 'title', name: '标题', width: 200 },
    { dataIndex: 'dept', name: '部门名称', width: 180 },
    { dataIndex: 'dest', name: '团建目的地', width: 160 },
    { dataIndex: 'guide', name: '当地导游', width: 160 },
    { fixed: true, name: '操作', render: renderOptions, width: 200 }
  ]
  const [openKeys, onChangeOpenKeys] = React.useState(['4', '4-2'])
  const pipeline = useTablePipeline({ components: { Checkbox } })
    .input({ dataSource, columns })
    .rowKey('id')
    .use(features.treeMode())
    .use(
      features.treeSelect({
        tree: dataSource,
        rootKey: 'root',
        checkboxPlacement: 'start',
        clickArea: 'cell',
        defaultValue: ['1-1', '3-2'],
        checkboxColumn: { lock: true },
        highlightRowWhenSelected: true,
      }),
    )

  return (
    <div>
      <Table {...pipeline.getProps()} />
    </div>
  )
}
```
