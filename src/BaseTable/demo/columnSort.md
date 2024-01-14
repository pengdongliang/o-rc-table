---
title: 拖拽列排序
order: 405
---

可以拖动表头来调整列的位置

用法:
pipeline.use(features.columnDrag)

```jsx
import React from "react";
import { Table, useTablePipeline, features } from "o-rc-table";

export default () => {
  const dataSource = [
    {
      id: "1",
      "No": 1,
      "order": "HK-FDF-24785-01",
      "from": "11111111",
      "to": "2222222",
      "amount": "29400.00",
      "balance": "1000.00"
    },
    {
      id: "2",
      "No": 2,
      "order": "HK-FDF-24785-01",
      "from": "11111111",
      "to": "2222222",
      "amount": "239400.00",
      "balance": "5000.00"
    },
    {
      id: "3",
      "No": 3,
      "order": "HK-FDF-24785-02",
      "from": "11111111",
      "to": "2222222",
      "amount": "249400.00",
      "balance": "3000.00"
    },
    {
      id: "4",
      "No": 4,
      "order": "AP-202009-00003",
      "from": "11111111",
      "to": "2222222",
      "amount": "219400.00",
      "balance": "4000.00"
    },
    {
      id: "5",
      "No": 5,
      "order": "AP-202009-00004",
      "from": "11111111",
      "to": "2222222",
      "amount": "239400.00",
      "balance": "5000.00"
    }
  ]

  const mockColumns = [
    { dataIndex: 'No', name: '序号', width: 60, align: 'center' },
    { dataIndex: 'order', name: '物流编码', width: 200, features: { sortable: true } },
    { dataIndex: 'from', name: '发货地', width: 200, features: { sortable: true } },
    { dataIndex: 'to', name: '收货地', width: 200, features: { sortable: true } },
    { dataIndex: 'amount', name: '应付金额', width: 100, align: 'right', features: { sortable: true } },
    { dataIndex: 'balance', name: '应收余额', width: 100, align: 'right', features: { sortable: true } }
  ]
  const [columns, setColumns] = React.useState(mockColumns)

  function SortIcon({ size = 32, style, className, order }) {
    return (
      <svg
        style={style}
        className={className}
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        width={size}
        height={size}
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <path fill={order === 'asc' ? '#23A3FF' : '#bfbfbf'} transform="translate(0, 6)" d="M8 8L16 0 24 8z" />
        <path fill={order === 'desc' ? '#23A3FF' : '#bfbfbf'} transform="translate(0, -6)" d="M24 24L16 32 8 24z " />
      </svg>
    )
  }

  const handleColumnDragStopped = (columnMoved, newColumns) => {
    if (columnMoved) {
      const columnSort = newColumns.reduce((columnSort, { dataIndex }, index) => {
        columnSort[dataIndex] = index
        return columnSort
      }, {})
      const columnAfterSort = columns.reduce((sortColumns, column) => {
        const { dataIndex } = column
        sortColumns[columnSort[dataIndex]] = column
        return sortColumns
      }, new Array(columns.length))
      if (columnAfterSort.filter(Boolean).length !== columns.length) return
      setColumns(columnAfterSort)
    }
  }
  const pipeline = useTablePipeline({
    components: {
      SortIcon: SortIcon
    }
  })
    .input({ dataSource: dataSource, columns: columns })
    .use(
      features.columnDrag({
        onColumnDragStart: () => {
        },
        onColumnDragEnd: () => {
        },
        onColumnDragStopped: handleColumnDragStopped
      })
    )
    .use(
      features.sort({})
    )
  return <Table {...pipeline.getProps()} className="aaa" />
}
```
