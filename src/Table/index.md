---
category: Components
group: 组件
title: antd表格
order: 0
---

兼容antd表格样式, 功能齐全, 开箱即用。

## 何时使用

1. 当需要使用表格时, 且需要使用 `antd` 的样式。

<embed src="./antdDiff.md"></embed>

## 如何使用

指定表格的数据源 `dataSource` 和列的定义 `columns` ，二者均为一个数组。

```tsx | pure
import { columns, dataSource } from '@table/constant'
import { Table } from 'o-rc-table'

export default () => {
  return <Table columns={columns} dataSource={dataSource} />
}
```

## 代码演示

[//]: # (<!-- prettier-ignore -->)

[//]: # (<code src="./demo/basic.tsx">动态控制表格属性</code>)

<!-- prettier-ignore -->
<code src="./demo/testPage/index.tsx">表格调试</code>
