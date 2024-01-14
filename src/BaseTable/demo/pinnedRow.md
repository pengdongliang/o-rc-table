---
title: 合计行
order: 401
---

为表格设置footerDataSource来添加底部固定行。
footerDataSource与dataSource的格式一致

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
      "order": "HK-FDF-24785-02",
      "from": "11111111",
      "to": "2222222",
      "amount": "239400.00",
      "balance": "5000.00"
    },
    {
      id: "3",
      "No": 3,
      "order": "AP-202009-00003",
      "from": "11111111",
      "to": "2222222",
      "amount": "249400.00",
      "balance": "3000.00"
    },
    {
      id: "4",
      "No": 4,
      "order": "AP-202009-00004",
      "from": "11111111",
      "to": "2222222",
      "amount": "219400.00",
      "balance": "4000.00"
    },
    {
      id: "5",
      "No": 5,
      "order": "AP-202009-00005",
      "from": "11111111",
      "to": "2222222",
      "amount": "239400.00",
      "balance": "5000.00"
    }
  ]

  const columns = [
    { dataIndex: 'No', name: '序号', width: 60, align: 'center' },
    { dataIndex: 'order', name: '物流编码', width: 200 },
    { dataIndex: 'from', name: '发货地', width: 200 },
    { dataIndex: 'to', name: '收货地', width: 200 },
    { dataIndex: 'amount', name: '应付金额', width: 100, align: 'right', aggType: 'sum' },
    { dataIndex: 'balance', name: '应收余额', width: 100, align: 'right', aggType: 'avg' }
  ]
  const pipeline = useTablePipeline({})
    .input({ dataSource: dataSource, columns: columns })
    .use(features.columnResize())
    .use(
      features.columnDrag({
        onColumnDragStart: () => {

        },
        onColumnDragEnd: () => {

        }
      })
    )

  // 获取合计行数据
  const getFooterDataSource = (dataSource, columns, seqField) => {
    const aggregateColumns = columns.filter(item => {
      return !!item.aggType
    })
    let footerDataSource = getCalculateData(dataSource, aggregateColumns)
    footerDataSource = Object.assign(footerDataSource, { [seqField]: '合计' })
    return Object.keys(footerDataSource).length === 0 ? [] : [footerDataSource]
  }

  const getFormatValue = (v) => {
    const reg = /(?=(\B\d{3})+$)/g //以三个数字结尾前面的空格
    v = (v + '').replace(reg, ',')
    return v + '.00'
  }

  const getCalculateData = (rowdatas, aggregateColumns) => {
    const data = {}
    if (aggregateColumns && aggregateColumns.length > 0 && rowdatas) {
      aggregateColumns.forEach(l => {
        let colResult = 0
        let colNaNValCount = 0
        rowdatas.forEach((row, i) => {
          let v
          const temporaryVal = parseFloat(row[l.dataIndex].replace(',', ''))
          if (isNaN(temporaryVal)) {
            v = 0
            if (!['avg', 'count'].includes(l.aggType)) {
              return
            }
            if (l.aggType === 'avg') { // 平均数需要记录空值的行
              colNaNValCount += 1
            }
          } else {
            v = temporaryVal
          }
          switch (l.aggType) {
            case 'sum': {
              if (v !== 0 || (!isNaN(temporaryVal) && v === 0)) {
                colResult = colResult + v
              }
              break
            }
            case 'min':
              colResult = Math.min(v, colResult)
              break
            case 'max':
              colResult = Math.max(v, colResult)
              break
            case 'avg': {
              colResult = colResult + v
              // 仅计算存在值的行
              const numberValRowCount = rowdatas.length - colNaNValCount
              if (i === rowdatas.length - 1 && numberValRowCount !== 0) {
                colResult = (colResult / numberValRowCount).toFixed(2)
              }
              break
            }
            case 'count':
              colResult = rowdatas.length
              break
            default:
              break
          }
        })
        data[l.dataIndex] = typeof colResult === 'string' ? getFormatValue(colResult) : getFormatValue(colResult.toString())
      })
    }
    return data
  }

  const footerDataSource = getFooterDataSource(dataSource, columns, 'seq')
  return <Table {...pipeline.getProps()} footerDataSource={footerDataSource} />
}
```
