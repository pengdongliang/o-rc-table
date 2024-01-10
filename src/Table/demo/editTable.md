---
title: 可编辑表格
order: 502
---

带单元格编辑功能的表格, 具体逻辑可以根据实际场景定制

```jsx
import React from "react";
import { Table, useTablePipeline, features } from "o-rc-table";

export default () => {
  const initDataSource = [
    {id: "1", "No":1,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"29400.00","balance":"1000.00"},
    {id: "2", "No":2,"order":"HK-FDF-24785-01","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"},
    {id: "3", "No":3,"order":"HK-FDF-24785-02","from":"11111111","to":"2222222","amount":"249400.00","balance":"3000.00"},
    {id: "4", "No":4,"order":"AP-202009-00003","from":"11111111","to":"2222222","amount":"219400.00","balance":"4000.00"},
    {id: "5", "No":5,"order":"AP-202009-00004","from":"11111111","to":"2222222","amount":"239400.00","balance":"5000.00"}
  ]

  const initColumns = [
    { code: 'No', name: '序号', width: 60, align: 'center'},
    { code: 'order', name: '单据号', width: 200, editable: true },
    { code: 'from', name: '来户', width: 200, editable: true  },
    { code: 'to', name: '往户', width: 200 , editable: true },
    { code: 'amount', name: '应付金额', width: 100, align: 'right'},
    { code: 'balance', name: '应收余额', width: 100, align: 'right'}
  ]

  const [dataSource, setDataSource] = React.useState(initDataSource)
  const [activeCell, setActiveCell] = React.useState({ row: -1, col: -1 });

  const getCellProps = (col) => (value, record, rowIndex) => {
    return {
      style: {},
      onClick (event) {
        const { row: preRow, col: preCol } = activeCell
        if (preRow !== rowIndex || preCol !== col) {
          setActiveCell({ row: rowIndex, col })
        }
      }
    };
  };

  const style = {
    width:'100%',
    height:'30px',
    padding: '2px 10px',
    border: '1px solid #cccccc',
    borderRadius:'2px'
  }

  const Editor = ({ value, colIndex, rowIndex }) => {
    const [cellValue, setValue] = React.useState(value);
    const onChange = (event) => {
      setValue(event.target.value);
    };
    React.useEffect(() => {
      setValue(value);
    }, [value]);

    const onBlur = () => {
      const code = initColumns[colIndex].code
      const newData = [...dataSource]
      newData.splice(rowIndex,1,{ ...dataSource[rowIndex],[code]:cellValue })
      setDataSource(newData)
      setActiveCell({ row: -1, col:-1 })
    };

    return (
      <input
        style={{...style, fontSize: 12}}
        value={cellValue}
        autoFocus
        onChange={onChange}
        onBlur={onBlur}
      />
    );
  };

  const transAction = (col, colIndex) => {
    col.getCellProps = getCellProps(colIndex);
    if (!col.editable) {
      return col
    }
    col.render = (value, record, rowIndex) => {
      if (activeCell.row === rowIndex && activeCell.col === colIndex) {
        return  <Editor
          colIndex={colIndex}
          rowIndex={rowIndex}
          value={value}
        />
      } else {
        return <div style={{...style, display: 'flex' , 'alignItems': 'center'}}>{value}</div>;
      }
    };
    return col;
  };
  const columns = initColumns.map(transAction)

  const pipeline = useTablePipeline().input({ dataSource: dataSource, columns: columns })
  return <Table {...pipeline.getProps()}  />
}
```
