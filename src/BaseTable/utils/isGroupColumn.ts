import { ColumnType } from '../interfaces'
// 是否是叶子节点
export default function isGroupColumn(columns: ColumnType[]) {
  return columns.findIndex((col) => col.children && col.children.length > 0) > -1
}
