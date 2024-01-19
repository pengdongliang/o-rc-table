import type { TableRowSelection } from '@table/interface'
import { ConfigProvider, Form, Radio, Switch, Tooltip } from 'antd'
import { ColumnType, type features, TableProps } from 'o-rc-table'
import React, { useCallback, useEffect, useState } from 'react'

import Table from '../Table'
import antdTheme from './antdTheme.json'

export default () => {
  const [dataCount, setDataCount] = useState(1000)
  const [ellipsis, setEllipsis] = useState(true)
  const [bordered, setBordered] = useState(true)
  const [useVirtual, setUseVirtual] = useState(true)
  const [dragColumnWidth, setDragColumnWidth] = useState(true)
  const [autoRowHeight, setAutoRowHeight] = useState(false)
  const [autoRowSpan, setAutoRowSpan] = useState(false)
  const [autoColSpan, setAutoColSpan] = useState(false)
  const [columnDrag, setColumnDrag] = useState<features.ColumnDragOptions>()
  const [columnHighlight, setColumnHighlight] = useState<features.ColumnRangeHoverFeatureOptions>()
  const [columnFixed, setColumnFixed] = useState(true)
  const [sort, setSort] = useState(false)
  const [filter, setFilter] = useState<features.FilterFeatureOptions>()
  const [rowSelection, setRowSelection] = useState<TableRowSelection>({ type: 'checkbox' })

  function makeChildren(prefix: number) {
    return [
      {
        id: `${prefix}-1`,
        No: '二级标题',
        order: '应用部',
        from: '云南大理',
        amount: '29400.00',
        balance: '1000.00',
        opt: `操作${prefix}-1`,
        children: [
          {
            id: `${prefix}-1-1`,
            No: '三级标题',
            order: '平台大前端-UED',
            from: '云南大理',
            amount: '29400.00',
            balance: '1000.00',
            opt: `操作${prefix}-1-1`,
            children: [],
          },
          {
            id: `${prefix}-1-2`,
            No: '三级标题',
            order: '平台大前端-前端',
            from: '云南大理',
            amount: '29400.00',
            balance: '1000.00',
            opt: `操作${prefix}-1-2`,
          },
        ],
      },
      {
        id: `${prefix}-2`,
        No: '二级标题',
        order: '应用部',
        from: '云南大理',
        amount: '29400.00',
        balance: '1000.00',
        opt: `操作${prefix}-2`,
        children: [
          {
            id: `${prefix}-2-1`,
            No: '三级标题',
            order: '平台大前端-UED',
            from: '云南大理',
            amount: '29400.00',
            balance: '1000.00',
            opt: `操作${prefix}-2-1`,
          },
          {
            id: `${prefix}-2-2`,
            No: '三级标题',
            order: '平台大前端-前端',
            from: '云南大理',
            amount: '29400.00',
            balance: '1000.00',
            opt: `操作${prefix}-2-2`,
          },
        ],
      },
      {
        id: `${prefix}-3`,
        No: '二级标题',
        order: '应用部',
        from: '云南大理',
        amount: '29400.00',
        balance: '1000.00',
        opt: `操作${prefix}-3`,
      },
    ]
  }

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
      children: makeChildren(index),
    }))
  }

  const [dataSource, setDataSource] = useState(getDataSource())

  const getColumns = useCallback(
    (count = 200) => {
      const baseColumns: TableProps['columns'] = [
        {
          dataIndex: 'order',
          title: '物流编码(长标题)',
          width: 100,
          ellipsis,
          features: { sortable: true, filterable: true },
        },
        { dataIndex: 'amount', name: '应付金额', width: 100, align: 'right', className: 'test-table-cell', colSpan: 1 },
        { dataIndex: 'balance', name: '应收余额', width: 100, align: 'right' },
        {
          dataIndex: 'from',
          title: '发货地',
          width: 200,
          features: { autoRowSpan, sortable: true, filterable: true },
        },
        {
          dataIndex: 'to',
          name: '收货地',
          width: '200px',
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
      ]

      return Array.from(Array(count))
        .reduce(
          (acc, _cur, index) =>
            acc.concat(
              baseColumns.map((item) => {
                return {
                  ...item,
                  name: (
                    <>
                      {item.name}
                      {index}
                    </>
                  ),
                }
              })
            ),
          [{ dataIndex: 'No', name: '序号', width: 150, fixed: columnFixed }]
        )
        .concat({ dataIndex: 'opt', name: '操作', width: 80, align: 'center', fixed: columnFixed })
    },
    [autoColSpan, autoRowSpan, columnFixed, ellipsis]
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
        <Form.Item label="单元格自动省略">
          <Switch value={ellipsis} onChange={setEllipsis} />
        </Form.Item>
        <Form.Item label="单元格边框">
          <Switch value={bordered} onChange={setBordered} />
        </Form.Item>
        <Form.Item label="虚拟滚动">
          <Switch
            value={useVirtual}
            onChange={(v) => {
              if (v) {
                setColumnDrag(undefined)
                setFinalColumns(getColumns())
                setDataSource(getDataSource())
                setDataCount(1000)
              } else {
                setFinalColumns(getColumns(20))
                setDataSource(getDataSource(20))
                setDataCount(20)
              }
              setUseVirtual(v)
            }}
          />
        </Form.Item>
        <Form.Item label="列宽拖拽">
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
        <Form.Item label="拖拽列位置">
          <Switch
            value={!!columnDrag}
            onChange={(v) => {
              if (v) {
                setFinalColumns(getColumns(20))
                setDataSource(getDataSource(20))
                setDataCount(20)
                setUseVirtual(false)
              } else {
                setFinalColumns(getColumns())
                setDataSource(getDataSource())
                setDataCount(1000)
                setUseVirtual(true)
              }
              setColumnDrag(v ? { onColumnDragStopped: handleColumnDragStopped } : undefined)
            }}
          />
        </Form.Item>
        <Form.Item label="列高亮">
          <Switch
            value={!!columnHighlight}
            onChange={(v) => {
              if (v) {
                setColumnHighlight({ headerHoverColor: '#75c5ea', hoverColor: '#75c5ea' })
              } else {
                setColumnHighlight(undefined)
              }
            }}
          />
        </Form.Item>
        <Form.Item label="列固定">
          <Switch value={columnFixed} onChange={setColumnFixed} />
        </Form.Item>
        <Form.Item label="排序">
          <Switch value={sort} onChange={setSort} />
        </Form.Item>
        <Form.Item label="过滤">
          <Switch
            value={!!filter}
            onChange={(v) => {
              if (v) {
                setFilter({
                  mode: 'single',
                  defaultFilters: [
                    {
                      dataIndex: 'order',
                      filter: ['HK-FDF-24785-01'],
                      filterCondition: 'contain',
                    },
                  ],
                })
              } else {
                setFilter(undefined)
              }
            }}
          />
        </Form.Item>
        <Form.Item label="行选择">
          <Radio.Group onChange={(e) => setRowSelection({ type: e.target.value })} value={rowSelection.type}>
            <Radio value="checkbox">多选</Radio>
            <Radio value="radio">单选</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
      <div style={{ marginBottom: '8px' }}>
        <Radio.Group
          value={dataCount}
          onChange={(e) => {
            const count = e.target.value
            setDataCount(count)
            setFinalColumns(getColumns(count))
            setDataSource(getDataSource(count))
          }}
        >
          <Radio.Button value={20}>行与列的数量: 20</Radio.Button>
          <Radio.Button value={100}>行与列的数量: 100</Radio.Button>
          <Radio.Button value={1000}>行与列的数量: 1000</Radio.Button>
          <Radio.Button value={5000}>行与列的数量: 5000</Radio.Button>
          <Radio.Button value={10000}>行与列的数量: 10000</Radio.Button>
        </Radio.Group>
      </div>
      <Table
        style={{ height: 600, width: '100%' }}
        dataSource={dataSource}
        columns={finalColumns}
        bordered={bordered}
        useVirtual={useVirtual}
        dragColumnWidth={dragColumnWidth}
        autoRowHeight={autoRowHeight}
        autoRowSpan={autoRowSpan}
        columnDrag={columnDrag}
        columnHighlight={columnHighlight}
        sort={sort}
        filter={filter}
        rowSelection={{
          columnTitle: rowSelection.type === 'checkbox' ? null : <div>选择</div>,
          onSelectAll: (selected, selectedRows, changeRows) => {
            console.info('onSelectAll', selected, selectedRows, changeRows)
          },
          onSelect: (record, selected, selectedRows, nativeEvent) => {
            console.info('onSelect', record, selected, selectedRows, nativeEvent)
          },
          onCell: (record) => ({ style: record.id === 2 ? { backgroundColor: '#ccc' } : {} }),
          getCheckboxProps: (record) => {
            return {
              disabled: record.id === 1,
            }
          },
          defaultSelectedRowKeys: [0, 2, 3, 5],
          ...rowSelection,
        }}
        expandable={{
          expandColumnDataIndex: '',
          indentSize: 20,
          onExpandedRowsChange: (expandedRows) => console.info('expandedRows', expandedRows),
          onExpand: (expanded, record) => {
            console.info('onExpand', expanded, record)
          },
          // rowExpandable: (record) => record.id === 1,
          showExpandColumn: false,
          // expandIcon: ({ onClick }) => <div onClick={onClick}>自定义展开图标</div>,
          columnWidth: 60,
          fixed: true,
          columnTitle: '展开',
          defaultExpandAllRows: true,
          expandedRowRender(row) {
            return (
              <div style={{ margin: '8px', textAlign: 'left' }}>
                <p>应付金额：{row.amount}</p>
                <p>应收余额：{row.balance}</p>
              </div>
            )
          },
        }}
      />
    </ConfigProvider>
  )
}
