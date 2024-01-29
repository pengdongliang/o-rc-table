import { EditOutlined } from '@ant-design/icons'
import { InputNumber, Popconfirm } from '@ocloud/antd'
import { StyledModify } from '@table/demo/complexPage/styled'

const defaultFieldsNames = {
  list: 'lockSalesResList',
}

export interface ForecastDetails {
  row: Record<string, any>
  index: number
  fieldsNames?: typeof defaultFieldsNames
}

export const ForecastDetails = (props: ForecastDetails) => {
  const { row, index, fieldsNames } = props
  const finalFieldsNames = { ...defaultFieldsNames, ...fieldsNames }

  return (
    <Popconfirm
      title="预测详情"
      destroyTooltipOnHide
      description={
        <StyledModify>
          {row.moq > 0 && (
            <div>
              <div>
                <span className="title">MOQ:</span>
                <InputNumber disabled min={0} precision={0} />
              </div>
              <div>
                <span className="title">当前总需求:</span>
                <InputNumber disabled min={0} precision={0} />
              </div>
              <div>
                <span className="title">当前MOQ欠数:</span>
                <InputNumber disabled min={0} precision={0} />
              </div>
              <div>
                <span className="title">SAP剩余需求:</span>
                <InputNumber disabled min={0} precision={0} />
              </div>
            </div>
          )}
          <div>
            <div>
              <span className="title">可变需求</span>
              <InputNumber
                defaultValue={row.lockSalesResList[index]?.predictSales}
                min={0}
                precision={0}
                onChange={() => {}}
              />
            </div>
            <div>
              <span className="title">火力池下单</span>
              <InputNumber
                min={0}
                precision={0}
                disabled
                defaultValue={row.lockSalesResList[index]?.dynamicPoolSales}
              />
            </div>
            <div>
              <span className="title">预测借货数量</span>
              <InputNumber disabled defaultValue={row.lockSalesResList[index]?.predictBorrowSales} />
            </div>
            <div>
              <span className="title">火力池借货数量</span>
              <InputNumber disabled defaultValue={row.lockSalesResList[index]?.dynamicPoolBorrowSales} />
            </div>
          </div>
        </StyledModify>
      }
      onConfirm={() => {}}
      onCancel={() => {}}
      okText="保存"
      cancelText="取消"
    >
      <>
        {!Lock && row.lockSalesResList[index].supportModifyFlag ? (
          <EditOutlined
            onClick={() => {
              if (row.moq <= 0) return false
            }}
          />
        ) : (
          ''
        )}
      </>
    </Popconfirm>
  )
}
