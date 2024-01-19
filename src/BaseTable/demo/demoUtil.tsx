import { Checkbox, Radio } from 'antd'
import {
  collectNodes,
  features,
  getTableClasses,
  isLeafNode,
  proto,
  Table,
  useTablePipeline as useInternalTablePipeline,
} from 'o-rc-table'
import Loading from 'o-rc-table/base/loading'

export { Checkbox, collectNodes, features, isLeafNode, Loading, proto, Radio, Table }

const namespace = 'o-rc-table'
const Classes = getTableClasses(namespace)

function SortIcon({ size = 32, style, className, order }) {
  return (
    <svg
      style={style}
      className={className}
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <path fill={order === 'asc' ? '#23A3FF' : '#bfbfbf'} transform="translate(0, 6)" d="M8 8L16 0 24 8z" />
      <path fill={order === 'desc' ? '#23A3FF' : '#bfbfbf'} transform="translate(0, -6)" d="M24 24L16 32 8 24z " />
    </svg>
  )
}

export const useTablePipeline = () => {
  const pipeline = useInternalTablePipeline({ components: { SortIcon, Checkbox, Radio } }).input({
    tableContext: { namespace, Classes },
  })
  return pipeline
}
