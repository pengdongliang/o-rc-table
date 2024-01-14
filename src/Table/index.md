---
category: Components
group: 组件
title: antd表格
order: 0
---

兼容antd表格样式, 功能齐全, 开箱即用。

## 何时使用

1. 当需要使用表格时, 且需要使用 `antd` 的样式。

## 与antd-table差异

以下仅列出缺少的部分或者有差异的地方

### 功能差异

- [x] 支持单/双向虚拟滚动, 默认满100个数量自动开启, 可手动控制开关
- [x] 支持表头吸顶, 表尾吸底
- [ ] 单元格自动省略, 自定义单元格省略提示
- [ ] 分页功能

### Api差异

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
