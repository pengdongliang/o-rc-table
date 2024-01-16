import { ConfigProvider, Form, Switch, Tooltip } from 'antd'
import { ColumnType, type features, TableProps } from 'o-rc-table'
import React, { useCallback, useEffect, useState } from 'react'

import Table from '../Table'
import antdTheme from './antdTheme.json'

export default () => {
  const [bordered, setBordered] = useState(true)
  const [useVirtual, setUseVirtual] = useState(true)
  const [dragColumnWidth, setDragColumnWidth] = useState(true)
  const [autoRowHeight, setAutoRowHeight] = useState(false)
  const [autoRowSpan, setAutoRowSpan] = useState(false)
  const [autoColSpan, setAutoColSpan] = useState(false)
  const [columnDrag, setColumnDrag] = useState<features.ColumnDragOptions>()

  const getDataSource = (count = 1000) => {
    return Array.from(Array(count)).map((_item, index) => ({
      id: index,
      No: index,
      order: `HK-FDF-24785-0${index}`,
      from: index < 2 ? '自动合并的行' : Math.random() * 10000,
      to: '2222222',
      amount: '29400.00',
      balance: '1000.00',
      opt: `操作${index}`,
    }))
  }

  const [dataSource, setDataSource] = useState(getDataSource())

  const getColumns = useCallback(
    (count = 200) => {
      const baseColumns: TableProps['columns'] = [
        { dataIndex: 'order', name: '物流编码(长标题)', width: 100, ellipsis: true },
        { dataIndex: 'from', name: '发货地', width: 200, features: { autoRowSpan: true } },
        {
          dataIndex: 'to',
          name: '收货地',
          width: 200,
          ...(autoColSpan
            ? {
                getCellProps: (_value, _record, rowIndex) => {
                  if (rowIndex === 1) {
                    return {
                      rowSpan: 2,
                      colSpan: 2,
                      style: { background: '#ffffff' },
                    }
                  }
                },
                render: (_text, _record, index) => {
                  if (index === 1) return <div>自动合并单元格</div>
                  return _text
                },
              }
            : {}),
        },
        { dataIndex: 'amount', name: '应付金额', width: 100, align: 'right' },
        { dataIndex: 'balance', name: '应收余额', width: 100, align: 'right' },
      ]

      return Array.from(Array(count))
        .reduce(
          (acc, _cur, index) =>
            acc.concat(
              baseColumns.map((item) => {
                return { ...item, name: item.name + index }
              })
            ),
          [{ dataIndex: 'No', name: '序号', width: 80, align: 'center', fixed: true }]
        )
        .concat({ dataIndex: 'opt', name: '操作', width: 80, align: 'center', fixed: true })
    },
    [autoColSpan]
  )

  const columns = React.useMemo<ColumnType[]>(() => {
    return getColumns()
  }, [getColumns])

  const [finalColumns, setFinalColumns] = useState(columns)

  const handleColumnDragStopped = (_columnMoved: any, nextColumns: any[]) => {
    const columnSeq = nextColumns.reduce((result, col, colIndex) => {
      result[col.dataIndex] = colIndex
      return result
    }, {})

    setFinalColumns(
      columns.reduce((result, col) => {
        result[columnSeq[col.dataIndex]] = { ...col }
        return result
      }, [])
    )
  }

  useEffect(() => {
    setFinalColumns(columns)
  }, [columns])

  return (
    <ConfigProvider theme={antdTheme} prefixCls="ocloud">
      <Form layout="inline" style={{ marginBottom: '10px' }}>
        <Form.Item label="单元格边框">
          <Switch value={bordered} onChange={(v) => setBordered(v)} />
        </Form.Item>
        <Form.Item label="虚拟滚动">
          <Switch
            value={useVirtual}
            onChange={(v) => {
              if (v) {
                setColumnDrag(undefined)
                setFinalColumns(getColumns())
                setDataSource(getDataSource())
              } else {
                setFinalColumns(getColumns(10))
                setDataSource(getDataSource(20))
              }
              setUseVirtual(v)
            }}
          />
        </Form.Item>
        <Form.Item label="拖动列宽">
          <Switch value={dragColumnWidth} onChange={(v) => setDragColumnWidth(v)} />
        </Form.Item>
        <Form.Item label="自动行高">
          <Tooltip title="如果column里设置了ellipsis: true, 自动行高无效">
            <Switch value={autoRowHeight} onChange={(v) => setAutoRowHeight(v)} />
          </Tooltip>
        </Form.Item>
        <Form.Item label="自动合并多行">
          <Switch value={autoRowSpan} onChange={(v) => setAutoRowSpan(v)} />
        </Form.Item>
        <Form.Item label="自动合并单元格">
          <Switch value={autoColSpan} onChange={(v) => setAutoColSpan(v)} />
        </Form.Item>
        <Form.Item label="拖拽列排序">
          <Switch
            value={!!columnDrag}
            onChange={(v) => {
              if (v) {
                setFinalColumns(getColumns(10))
                setDataSource(getDataSource(20))
                setUseVirtual(false)
              } else {
                setFinalColumns(getColumns())
                setDataSource(getDataSource())
                setUseVirtual(true)
              }
              setColumnDrag(v ? { onColumnDragStopped: handleColumnDragStopped } : undefined)
            }}
          />
        </Form.Item>
      </Form>
      <Table
        dataSource={dataSource}
        columns={finalColumns}
        bordered={bordered}
        useVirtual={useVirtual}
        dragColumnWidth={dragColumnWidth}
        autoRowHeight={autoRowHeight}
        autoRowSpan={autoRowSpan}
        columnDrag={columnDrag}
        style={{ height: 600, width: '100%' }}
      />
    </ConfigProvider>
  )
}
