---
title: 自定义过滤菜单
order: 23
---

通过 `filterPanel` 自定义的列过滤功能。
<br/>
同时你可以设置 `column.features.filterable` 为一个函数来作为该列的过滤函数。

```jsx
import React from "react";
import { Table, useTablePipeline, features } from "o-rc-table";

export default () => {
  const [ filters, setFilters ] = React.useState([{dataIndex:'order',filter:'AP-202009-00001'}])

  const dataSource = [
    {id: "1", "No":1,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"29400.00","balance":"1000.00"},
    {id: "2", "No":2,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"},
    {id: "3", "No":3,"order":"HK-FDF-24785-02","from":"11111111","to":"2222222","amount":"249400.00","balance":"3000.00"},
    {id: "4", "No":4,"order":"AP-202009-00003","from":"11111111","to":"2222222","amount":"219400.00","balance":"4000.00"},
    {id: "5", "No":5,"order":"AP-202009-00004","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"}
  ]


  const getColumnFilterPanelProps = () => {
    const filterPanel = (props) => {
      const { setFilter, filterModel, isFilterActive, hidePanel } = props
      const [filterValue, setFilterValue] = React.useState(filterModel && filterModel.filter ? filterModel.filter[0] : '')

      const handleSearch = (handleSearch) => {
        hidePanel()
        setFilter(filterValue)
      }

      const handleReset = () => {
        hidePanel()
        setFilter()
      }

      React.useEffect(()=>{
        setFilterValue(filterModel && filterModel.filter ? filterModel.filter[0] : '')
      },[filterModel])


      return (<div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '5px'
        }}
      >
        <Input
          placeholder="输入过滤值"
          borderType="bordered"
          value={filterValue}
          onChange={e => setFilterValue(e.target.value ? [e.target.value] : [])}
        />
        <button type="primary" onClick={handleSearch} style={{marginLeft:'5px'}}>搜索</button>
        <button  onClick={handleReset} style={{marginLeft:'5px'}}>重置</button>
      </div>)
    }
    return {
      filterPanel
    }
  }

  const columns = [
    { dataIndex: 'No', name: '序号', width: 60, align: 'center' },
    { dataIndex: 'order', name: '物流编码', width: 200, features: {
        filterable: true ,
        ...getColumnFilterPanelProps()
      }
    },
    { dataIndex: 'from', name: '发货地', width: 200, features: {  filterable: true } },
    { dataIndex: 'to', name: '收货地', width: 200, features: {  filterable: true } },
    { dataIndex: 'amount', name: '应付金额', width: 100, align: 'right', features: {
        filterable: (filterValue) => (value) => {
          if (value == null) {
            return false
          }
          if (typeof value === 'number') {
            value = value + ''
          }
          return value.includes(filterValue)
        },
        ...getColumnFilterPanelProps()
      }
    },
    { dataIndex: 'balance', name: '应收余额', width: 100, align: 'right', features: {  filterable: true } }
  ]


  const handleFiltersChanged = (nextFilters) => {
    console.log('nextFilters', nextFilters)
    setFilters(nextFilters)
  }


  const pipeline = useTablePipeline({})
    .input({ dataSource: dataSource, columns: columns })
    .use(
      features.filter({
        filters,
        onChangeFilters: handleFiltersChanged,
      })
    )
  return <Table {...pipeline.getProps()} />
}
```


