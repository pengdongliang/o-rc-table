/* eslint-disable */
import { ColumnType, CellProps } from '../../interfaces'
import { collectNodes, isLeafNode, isSelectColumn, makeRecursiveMapper, mergeCellProps } from '../../utils'
import { TablePipeline } from '../pipeline'
import { FILL_COLUMN_CODE } from './autoFill'

const stateKey = 'columnDrag'
const SCROLL_SIZE = 30

function disableSelect(event) {
  event.preventDefault()
}
export interface ColumnDragOptions {
  onColumnDragStopped?: (columnMoved: boolean, columns: ColumnType[]) => void
}

function sortColumns(columns: any[], sort: any) {
  const res = new Array(columns.length)
  const lastColumns = [...columns]
  while (columns.length) {
    const cloumn = columns.pop()
    res[sort[cloumn.dataIndex]] = cloumn
  }
  if (res.filter(Boolean).length !== lastColumns.length) {
    return lastColumns
  }
  return res
}

function stopClickPropagation(e) {
  e.stopPropagation()
}

export function columnDrag(opts: ColumnDragOptions = {}) {
  return (pipeline: TablePipeline) => {
    const { cloumnsTranslateData } = pipeline.getStateAtKey(stateKey, {} as any)
    const columns = pipeline.getColumns()
    const tableBody = pipeline.ref.current.domHelper && pipeline.ref.current.domHelper.tableBody
    // if (cloumnsSortData) {
    //   columns = sortColumns(columns, cloumnsSortData)
    // }

    pipeline.columns(columns.filter((column) => column))

    return pipeline.mapColumns(
      makeRecursiveMapper((col, recursiveFlatMapInfo) => {
        const { path, isLeaf } = recursiveFlatMapInfo
        const style: any = cloumnsTranslateData
          ? {
              transition: '.3s',
              transform: `translate3d(${cloumnsTranslateData[col.dataIndex]}px, 0px, 0px)`,
            }
          : {}
        const prevGetCellProps = col.getCellProps
        // !col.dataIndex: 选择列 col.fixed: 固定列 不允许拖拽
        if (col.fixed || !col.dataIndex) return col
        return {
          ...col,
          getCellProps(value: any, record: any, rowIndex: number): CellProps {
            const prevCellProps = prevGetCellProps?.(value, record, rowIndex)
            return mergeCellProps(prevCellProps, {
              style: style as any,
            })
          },
          headerCellProps: mergeCellProps(col.headerCellProps, {
            onMouseDown:
              !isLeaf || path.length > 1
                ? undefined
                : (e) => {
                    if (e.button !== 0 || !e.currentTarget.contains(e.target as HTMLElement)) {
                      return
                    }
                    window.addEventListener('selectstart', disableSelect)
                    // const cx = e.clientX
                    // const width = col.width
                    // const a = startIndex
                    // const b = endIndex
                    // const newColumnDragData = [...columnDragData]
                    // let newColumn = [...columns]
                    // let newStartIndex = startIndex
                    // let endIdx = endIndex
                    let columnMoved = false
                    const columns = pipeline.getColumns()
                    let { cloumnsTranslateData } = pipeline.getStateAtKey(stateKey, {} as any)
                    const cloumnsSortData = {}
                    columns.forEach((item, index) => {
                      cloumnsSortData[item.dataIndex] = index
                    })

                    let currentTarget = e.currentTarget as HTMLElement
                    const rect = (e.currentTarget as HTMLElement).parentElement.getClientRects()[0]
                    const startX = rect.left
                    const mouseDownClientX = e.clientX
                    const mouseDownClientY = e.clientY
                    let moveData = []

                    const allColumns = collectNodes(columns)
                    const tableBodyClientRect = tableBody.getBoundingClientRect()
                    const startScrollLeft = pipeline.ref.current.domHelper.virtual.scrollLeft
                    const updateScrollPosition = (client) => {
                      const { clientX } = client
                      const { left, width } = tableBodyClientRect
                      if (clientX + SCROLL_SIZE >= left + width) {
                        pipeline.ref.current.domHelper.virtual.scrollLeft += SCROLL_SIZE
                      }
                      if (clientX - SCROLL_SIZE <= left) {
                        pipeline.ref.current.domHelper.virtual.scrollLeft -= SCROLL_SIZE
                      }
                    }

                    function handleMouseMove(e) {
                      const client = {
                        clientX: e.clientX,
                        clientY: e.clientY,
                      }
                      const scrollDistance = pipeline.ref.current.domHelper.virtual.scrollLeft - startScrollLeft
                      const leftPosition = startX - scrollDistance // 表头最左边起点
                      updateScrollPosition(client)
                      if (e.clientX - leftPosition < 20) {
                        return
                      }
                      e.stopPropagation()

                      document.body.style.userSelect = 'none'
                      currentTarget.style.cursor = 'move'

                      // 循环计算每一个的位置
                      // if (startIndex !== replaceIndex) {
                      //   const optionColumn = columns[startIndex]
                      //   const move = startIndex > replaceIndex ? 1 : -1
                      //   let index = Math.min(startIndex, replaceIndex)
                      //   while (index < Math.max(startIndex, replaceIndex)) {
                      //     const dataIndex = columns[index].dataIndex
                      //     cloumnsTranslateData[dataIndex] += move * optionColumn.width
                      //     cloumnsTranslateData[optionColumn.dataIndex] -= move * optionColumn.width
                      //     index += move
                      //   }
                      // }

                      // const opColumn = columns[startIndex]
                      // let index = Math.min(startIndex, replaceIndex)
                      // while (index <= Math.max(startIndex, replaceIndex)) {
                      //   const dataIndex = columns[index].dataIndex
                      //   if (index !== startIndex && index !== replaceIndex) {
                      //     cloumnsTranslateData[dataIndex] += opColumn.width * (index > startIndex ? -1 : 1)
                      //     cloumnsTranslateData[opColumn.dataIndex] += columns[index].width * (index < startIndex ? -1 : 1)
                      //   }
                      //   index++
                      // }

                      // 重置位置信息
                      cloumnsTranslateData = {}
                      allColumns.forEach((item) => {
                        cloumnsTranslateData[item.dataIndex] = 0
                      })

                      // 计算平移位置
                      let replaceIndex = 0
                      let totalWitdth = getColumnWidth(columns[replaceIndex])
                      while (totalWitdth < e.clientX - leftPosition && replaceIndex < columns.length - 1) {
                        replaceIndex++
                        totalWitdth += getColumnWidth(columns[replaceIndex])
                      }

                      // 需要取最新startIndex, 不能直接用makeRecursiveMapper提供的startIndex（因为map时还没添加选择列、充满列等后面use添加的列）
                      let startIndex
                      columns.forEach((column, index) => {
                        if (column.dataIndex === col.dataIndex) {
                          startIndex = index
                        }
                      })

                      const optionColumn = columns[startIndex]
                      let index = replaceIndex
                      if (startIndex > replaceIndex) {
                        // 左移
                        while (index < startIndex) {
                          const { dataIndex, fixed, width, children } = columns[index]
                          if (enableMove({ dataIndex, fixed })) {
                            cloumnsTranslateData[dataIndex] += optionColumn.width
                            if (isLeafNode(columns[index])) {
                              cloumnsTranslateData[optionColumn.dataIndex] -= width
                            } else {
                              cloumnsTranslateData[optionColumn.dataIndex] -= getColumnWidth(columns[index])
                              moveAllChildren(children, cloumnsTranslateData, optionColumn.width)
                            }
                            columnMoved = true
                          }
                          index++
                        }
                      } else if (startIndex < replaceIndex) {
                        // 右移
                        while (startIndex < index) {
                          const { dataIndex, fixed, width, children } = columns[index]
                          if (enableMove({ dataIndex, fixed })) {
                            cloumnsTranslateData[dataIndex] -= optionColumn.width
                            if (isLeafNode(columns[index])) {
                              cloumnsTranslateData[optionColumn.dataIndex] += width
                            } else {
                              cloumnsTranslateData[optionColumn.dataIndex] += getColumnWidth(columns[index])
                              moveAllChildren(children, cloumnsTranslateData, optionColumn.width, true)
                            }
                            columnMoved = true
                          }
                          index--
                        }
                      }

                      window.requestAnimationFrame(() => {
                        pipeline.setStateAtKey(stateKey, {
                          cloumnsTranslateData,
                        })
                        moveData = [startIndex, replaceIndex]
                      })
                    }
                    function handleMouseUp(e) {
                      document.body.removeEventListener('mousemove', handleMouseMove)
                      document.body.removeEventListener('mouseup', handleMouseUp)
                      window.removeEventListener('selectstart', disableSelect)
                      if (_isMoveWhenClicking(mouseDownClientX, mouseDownClientY, e.clientX, e.clientY)) {
                        e.stopPropagation() // 存在移动就阻止冒泡
                        currentTarget.addEventListener('click', stopClickPropagation) // 阻止列头点击事件，防止拖动后触发列头过滤事件
                      }
                      window.requestAnimationFrame(() => {
                        // 取消阻止列头点击事件
                        currentTarget.removeEventListener('click', stopClickPropagation)
                        currentTarget = null

                        const [startIndex, replaceIndex] = moveData
                        const optionColumn = columns[startIndex]
                        // const move = startIndex > replaceIndex ? 1 : -1
                        // let index = Math.min(startIndex, replaceIndex)
                        // while (index < Math.max(startIndex, replaceIndex) && index > 0) {
                        //   const dataIndex = columns[index].dataIndex
                        //   cloumnsSortData[optionColumn.dataIndex] -= move
                        //   cloumnsSortData[dataIndex] += move
                        //   index += move
                        // }
                        let index = replaceIndex
                        if (startIndex > replaceIndex) {
                          // 左移
                          while (index < startIndex) {
                            const { dataIndex, fixed } = columns[index]
                            if (enableMove({ dataIndex, fixed })) {
                              cloumnsSortData[dataIndex] += 1
                              cloumnsSortData[optionColumn.dataIndex] -= 1
                              columnMoved = true
                            }
                            index++
                          }
                        } else if (startIndex < replaceIndex) {
                          // 右移
                          while (index > startIndex) {
                            const { dataIndex, fixed } = columns[index]
                            if (enableMove({ dataIndex, fixed })) {
                              cloumnsSortData[dataIndex] -= 1
                              cloumnsSortData[optionColumn.dataIndex] += 1
                              columnMoved = true
                            }
                            index--
                          }
                        }
                        const { onColumnDragStopped } = opts
                        // 拖拽结束返回列顺序
                        if (onColumnDragStopped) {
                          const isRowDragColumn = (dataIndex) => {
                            const rowDragColumnKey = pipeline.getFeatureOptions('rowDragColumnKey')
                            return dataIndex === rowDragColumnKey
                          }
                          const newColumns = sortColumns(columns, cloumnsSortData).filter(
                            (column) =>
                              column.dataIndex !== FILL_COLUMN_CODE &&
                              !isRowDragColumn(column.dataIndex) &&
                              !isSelectColumn(column)
                          )
                          // TODO drag需要在resize之后use,否则这里返回的列对应的宽度不是拖拽后的
                          onColumnDragStopped(columnMoved, newColumns)
                        }
                        pipeline.setStateAtKey(stateKey, {
                          cloumnsTranslateData: null,
                        })
                      })
                      document.body.style.userSelect = ''
                      currentTarget.style.opacity = ''
                      currentTarget.style.cursor = ''
                    }
                    document.body.addEventListener('mousemove', handleMouseMove)
                    document.body.addEventListener('mouseup', handleMouseUp)
                  },
            style,
          }),
        }
      })
    )
  }
}

function enableMove({ fixed, dataIndex }) {
  return dataIndex && dataIndex !== FILL_COLUMN_CODE && !fixed
}

function getColumnWidth(col: ColumnType): number {
  if (col.children) {
    return col.children.reduce((acc, col) => {
      return acc + getColumnWidth(col)
    }, 0)
  }
  return col.width
}

function moveAllChildren(cols: ColumnType[], cloumnsTranslateData, width: number, isMinus?: boolean) {
  cols.forEach((col) => {
    const { dataIndex, children } = col
    const movedWidth = cloumnsTranslateData[dataIndex] ?? 0
    cloumnsTranslateData[dataIndex] = movedWidth + (isMinus ? -width : width)
    if (!isLeafNode(col)) {
      moveAllChildren(children, cloumnsTranslateData, width)
    }
  })
}

function _isMoveWhenClicking(
  mouseDownClientX: number,
  mouseDownClientY: number,
  mouseUpClientX: number,
  mouseUpClientY: number
): boolean {
  const xDiff = mouseUpClientX - mouseDownClientX
  const yDiff = mouseUpClientY - mouseDownClientY
  // 鼠标点按和松开的偏移量大于5px，认为存在移动
  if (Math.sqrt(xDiff * xDiff + yDiff * yDiff) > 5) {
    return true
  }
  return false
}
