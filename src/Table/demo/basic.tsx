import { columns, dataSource } from '../constant'
import Table from '../Table'

export default () => {
  return <Table dataSource={dataSource} columns={columns} />
}
