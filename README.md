# o-rc-table

[![NPM version](https://img.shields.io/npm/v/o-rc-table.svg?style=flat)](https://npmjs.org/package/o-rc-table)
[![NPM downloads](http://img.shields.io/npm/dm/o-rc-table.svg?style=flat)](https://npmjs.org/package/o-rc-table)

Table ui component for react

> [在线文档](https://rc-table.netlify.app/components/table)

## 安装

`npm install o-rc-table`

## 特点

- 高性能，内置虚拟滚动，数据量较大时自动开启
- 兼容ant-design表格样式和Api
- 扩展了其它一些常用的表格功能
- 可扩展兼容其它框架的表格组件

## 如何使用

指定表格的数据源 `dataSource` 和列的定义 `columns` ，二者均为一个数组。

```tsx | pure
import { columns, dataSource } from '@table/constant'
import { Table } from 'o-rc-table'

export default () => {
  return <Table columns={columns} dataSource={dataSource} />
}
```

## LICENSE

MIT
