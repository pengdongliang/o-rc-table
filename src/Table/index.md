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

```tsx
import { columns, dataSource } from '@table/constant'
import { Table, useTablePipeline } from 'o-rc-table'

export default () => {
  const pipeline = useTablePipeline().input({ dataSource, columns })

  return <Table {...pipeline.getProps()} />
}
```

## 代码演示

<!-- prettier-ignore -->
<code src="./demo/basic.tsx">基本用法</code>
