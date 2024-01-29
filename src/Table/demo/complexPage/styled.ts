import { css } from '@emotion/react'
import styled from '@emotion/styled'
import type { FormItemType } from '@ocloud/antd'

interface StyledProps {
  formItemOptions: FormItemType[]
}
export const TableStyle = styled.div<StyledProps>(({ formItemOptions }) => {
  return css`
    .ellipsisText {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
    }
    .selected {
      td {
        background-color: #e9f4f4 !important;
      }
    }
    .td-red {
      background-color: red !important;
      color: #fff;
    }
    .ocloud-table-body {
      height: ${formItemOptions?.length ? '' : 'auto !important'};
      min-height: ${formItemOptions?.length ? '' : '50px !important'};
      max-height: ${formItemOptions?.length ? '' : '703px !important'};
    }
    .fixed-style-yellow {
      background-color: rgb(255, 255, 0) !important;
    }
    .disable {
      background-color: #f4f4f5 !important;
    }
    .fontDisable {
      color: #b6b6b6 !important;
    }
    .fontClick {
      cursor: pointer;
      color: #298df0 !important;
    }
    .fixed-style-brown {
      background-color: rgb(250, 205, 145) !important;
    }
  `
})

export const StyledModify = styled.div`
  & {
    display: flex;
    & > div > div {
      height: 40px;
      display: flex;
      align-items: center;
      margin-right: 10px;
    }
  }
  .title {
    width: 95px;
    text-align: right;
    display: block;
    margin-left: 13px;
    margin-right: 10px;
  }
`
