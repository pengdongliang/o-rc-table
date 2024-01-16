import { ColumnType } from '../interfaces'
import { BaseTableContextProps } from '.'

export type VirtualEnum = false | true | 'auto'

export interface VerticalRenderRange {
  topIndex: number
  topBlank: number
  bottomIndex: number
  bottomBlank: number
}

export interface HorizontalRenderRange {
  leftIndex: number
  leftBlank: number
  rightIndex: number
  rightBlank: number
}

// VisibleColumnDescriptor 用于在表格内部描述「那些在页面中可见的列」
export type VisibleColumnDescriptor =
  | { type: 'blank'; blankSide: 'left' | 'right'; width: number; isPlacehoder?: boolean }
  | { type: 'normal'; colIndex: number; col: ColumnType }

export interface ResolvedUseVirtual {
  horizontal: boolean
  vertical: boolean
  header: boolean
}

export interface RenderInfo extends Partial<BaseTableContextProps> {
  verticalRenderRange: VerticalRenderRange
  horizontalRenderRange: HorizontalRenderRange
  visible: VisibleColumnDescriptor[]

  flat: { full: ColumnType[]; left: ColumnType[]; center: ColumnType[]; right: ColumnType[] }
  nested: { full: ColumnType[]; left: ColumnType[]; center: ColumnType[]; right: ColumnType[] }
  stickyLeftMap: Map<number, number>
  stickyRightMap: Map<number, number>
  useVirtual: ResolvedUseVirtual

  /** props.columns 是否包含有效的锁列 */
  hasLockColumn: boolean
  /** 左侧锁定列的总宽度 */
  leftLockTotalWidth: number
  /** 右侧锁定列的总宽度 */
  rightLockTotalWidth: number
}
