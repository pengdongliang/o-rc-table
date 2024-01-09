---
title: 数据加载中
order: 30
---

可以通过指定表格参数`isLoading`来显示加载中效果。

```jsx
import React from "react";
import { Table, useTablePipeline, features } from "o-rc-table";

export default () => {

  const [ isLoading, setIsLoadding ] = React.useState(false)
  const [dataSource,setDataSource] = React.useState([])

  const columns = [
    { code: 'No', name: '序号', width: 60, align: 'center' },
    { code: 'order', name: '单据号', width: 200 },
    { code: 'from', name: '来户', width: 200 },
    { code: 'to', name: '往户', width: 200 },
    { code: 'amount', name: '应付金额', width: 100, align: 'right' },
    { code: 'balance', name: '应收余额', width: 100, align: 'right' }
  ]

  const requestDataMock = () => {
    const dataSource = [
      {id: "1", "No":1,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"29400.00","balance":"1000.00"},
      {id: "2", "No":2,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"},
      {id: "3", "No":3,"order":"HK-FDF-24785-02","from":"11111111","to":"2222222","amount":"249400.00","balance":"3000.00"},
      {id: "4", "No":4,"order":"AP-202009-00003","from":"11111111","to":"2222222","amount":"219400.00","balance":"4000.00"},
      {id: "5", "No":5,"order":"AP-202009-00004","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"}
    ]
    return new Promise((resolve, reject)=>{
      setTimeout(()=>{
        resolve(dataSource)
      },2000)
    })
  }

  const showLoadding = () => {
    setIsLoadding(true)
  }

  const hideLoadding = () => {
    setIsLoadding(false)
  }

  React.useEffect(()=>{
    setIsLoadding(true)
    requestDataMock().then(data=>{
      setDataSource(data)
      setIsLoadding(false)
    })
  },[])


  const pipeline = useTablePipeline({}).input({ dataSource: dataSource, columns: columns })

  return <div>
    <button type="primary" onClick={showLoadding}>显示加载动画</button>
    <button  onClick={hideLoadding} style={{marginLeft:'5px'}}>隐藏加载动画</button>
    <br/>
    <br/>
    <Table {...pipeline.getProps()} isLoading={isLoading}/>
  </div>
}
```


