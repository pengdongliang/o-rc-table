---
title: 拖拽列排序
order: 405
---
可以拖动表头来调整列的位置

用法:
pipeline.use(features.columnDrag)

```jsx
() => {
  const dataSource = [
    {id: "1", "No":1,"order":"AP-202009-00001","from":"陕西环宇科技","to":"深圳环球科技","amount":"26,800.00","balance":"5,200.00"},
    {id: "2", "No":2,"order":"AP-202009-00001","from":"陕西环宇科技","to":"深圳环球科技","amount":"236,800.00","balance":"1,500.00"},
    {id: "3", "No":3,"order":"AP-202009-00002","from":"陕西环宇科技","to":"深圳环球科技","amount":"246,800.00","balance":"5,300.00"},
    {id: "4", "No":4,"order":"AP-202009-00003","from":"陕西环宇科技","to":"深圳环球科技","amount":"216,800.00","balance":"5,400.00"},
    {id: "5", "No":5,"order":"AP-202009-00004","from":"陕西环宇科技","to":"深圳环球科技","amount":"236,800.00","balance":"1,500.00"}
  ]

  const mockColumns = [
    { code: 'No', name: '序号', width: 60, align: 'center' },
    { code: 'order', name: '单据号', width: 200, features: { sortable: true }},
    { code: 'from', name: '来户', width: 200, features: { sortable: true} },
    { code: 'to', name: '往户', width: 200, features: { sortable: true} },
    { code: 'amount', name: '应付金额', width: 100, align: 'right', features: { sortable: true} },
    { code: 'balance', name: '应收余额', width: 100, align: 'right', features: { sortable: true} }
  ]
  const [columns, setColumns] = useState(mockColumns)
  function SortIcon ({ size = 32, style, className, order }) {
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
        const columnSort = newColumns.reduce((columnSort, { code }, index) => {
          columnSort[code] = index
          return columnSort
        }, {})
        const columnAfterSort = columns.reduce((sortColumns, column) => {
          const { code } = column
          sortColumns[columnSort[code]] = column
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
        onColumnDragStart: () => {},
        onColumnDragEnd: () => {},
        onColumnDragStopped: handleColumnDragStopped
      })
    )
    .use(
      features.sort({})
    )
  return <Table {...pipeline.getProps()} className="aaa" />
}
```
