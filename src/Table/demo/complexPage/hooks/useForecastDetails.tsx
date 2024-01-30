import { InputNumber, Popconfirm, Tooltip, type TooltipProps } from '@ocloud/antd'
import { StyledModify } from '@table/demo/complexPage/styled'
import { useCallback } from 'react'
import ReactDOM from 'react-dom'

const defaultFieldsNames = {
  listField: 'lockSalesResList',
}

export interface RenderPopconfirmType {
  row: Record<string, any>
  index: number
  event: React.MouseEvent<HTMLElement>
  fieldsNames?: typeof defaultFieldsNames
  children: React.ReactNode
  clsName: string
}

export type RenderTooltipType = Pick<RenderPopconfirmType, 'event' | 'children'> & TooltipProps

export const useForecastDetails = () => {
  const renderPopconfirm = useCallback((args: RenderPopconfirmType) => {
    const { row, index, fieldsNames, event, children, clsName } = args
    const { listField } = { ...defaultFieldsNames, ...fieldsNames }
    const target = (event.target as any).closest(`.${clsName}`)

    const PopconfirmItem = (
      <Popconfirm
        title="预测详情"
        destroyTooltipOnHide
        defaultOpen
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
                  defaultValue={row[listField][index]?.predictSales}
                  min={0}
                  precision={0}
                  onChange={() => {}}
                />
              </div>
              <div>
                <span className="title">火力池下单</span>
                <InputNumber min={0} precision={0} disabled defaultValue={row[listField][index]?.dynamicPoolSales} />
              </div>
              <div>
                <span className="title">预测借货数量</span>
                <InputNumber disabled defaultValue={row[listField][index]?.predictBorrowSales} />
              </div>
              <div>
                <span className="title">火力池借货数量</span>
                <InputNumber disabled defaultValue={row[listField][index]?.dynamicPoolBorrowSales} />
              </div>
            </div>
          </StyledModify>
        }
        onConfirm={() => {}}
        onCancel={() => {}}
        okText="保存"
        cancelText="取消"
        onPopupClick={() => {}}
      >
        {children}
      </Popconfirm>
    )

    // eslint-disable-next-line react/no-deprecated
    ReactDOM.render(PopconfirmItem, target)
  }, [])

  const renderTooltip = useCallback((args: RenderTooltipType) => {
    const { event, children, clsName, ...rest } = args
    const target = (event.target as any).closest(`.${clsName}`)

    const Item = (
      <Tooltip
        placement="leftBottom"
        defaultOpen
        destroyTooltipOnHide
        fresh
        mouseEnterDelay={0.5}
        mouseLeaveDelay={0}
        {...rest}
      >
        {children}
      </Tooltip>
    )

    // eslint-disable-next-line react/no-deprecated
    target && ReactDOM.render(event.type === 'mouseleave' ? <>{children}</> : Item, target)
  }, [])

  return { renderPopconfirm, renderTooltip }
}
