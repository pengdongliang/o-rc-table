---
title: 嵌套子表格
order: 403
---
通过 options.renderDetail 渲染 BaseTable 可以实现表格嵌套。
```jsx
() => {
  const dataSource = [
    {id:"1","No":1,"order":"AP-202009-00001","from":"陕西环宇科技","to":"深圳环球科技","amount":"26,800.00","balance":"5,200.00"},
    {id:"2","No":2,"order":"AP-202009-00002","from":"陕西环宇科技","to":"深圳环球科技","amount":"236,800.00","balance":"1,500.00"},
    {id:"3","No":3,"order":"AP-202009-00003","from":"陕西环宇科技","to":"深圳环球科技","amount":"246,800.00","balance":"5,300.00"},
    {id:"4","No":4,"order":"AP-202009-00004","from":"陕西环宇科技","to":"深圳环球科技","amount":"216,800.00","balance":"5,400.00"},
    {id:"5","No":5,"order":"AP-202009-00005","from":"陕西环宇科技","to":"深圳环球科技","amount":"236,800.00","balance":"1,500.00"}
  ]

  const columns = [
    { code: 'No', name: '序号', width: 60, align: 'center' },
    { code: 'order', name: '单据号', width: 200 },
    { code: 'from', name: '来户', width: 200 },
    { code: 'to', name: '往户', width: 200 },
    { code: 'amount', name: '应付金额', width: 100, align: 'right' },
    { code: 'balance', name: '应收余额', width: 100, align: 'right' }
  ]
  const pipeline = useTablePipeline()
  .input({ dataSource: dataSource, columns: columns })
  .primaryKey('id')
  .use(
    features.rowDetail({
      defaultOpenKeys: ['2'],
      renderDetail() {
        return (
          <Table
              style={{ boxShadow: '0 0 4px 1px #33333333', margin: 8 }}
              hasHeader={false}
              className="bordered compact"
              dataSource={dataSource}
              columns={columns}
            />
        )
      },
    }),
  )
  return <Table {...pipeline.getProps()} />
}
```
