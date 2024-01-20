import { css } from '@emotion/react'
import styled from '@emotion/styled'

export const StyledTableLayout = styled.div<{ tableHeight: number }>(({ theme, tableHeight }) => {
  const { namespace } = theme

  return css`
    &.table_layout {
      .${namespace}-table-container {
        & > .${namespace}-table-body {
          border-bottom: 1px solid #e7e7e7;
          height: ${tableHeight}px;

          & > table {
            .${namespace}-table-placeholder {
              .${namespace}-table-cell {
                padding: 0;
                border: 0;
              }
            }
          }
        }
      }

      .${namespace}-table-container:first-of-type {
        border-top: 1px solid #e7e7e7 !important;
      }
    }
  `
})

export const StyledTableLayoutReplaceBox = styled.div(({ theme }) => {
  const { colors, namespace } = theme
  return css`
    &.layout-table-page {
      .layout-table-split > .${namespace}-space-item {
        background-color: ${colors?.white};

        &:last-child {
          padding: 8px 10px;
        }

        .table_before_cotainer {
          margin-bottom: 8px;
        }

        .${namespace}-pagination {
          margin: 0;
          margin-top: 8px;
        }

        .table-search-form_container {
          padding: 8px 10px 0;
        }
      }
    }
  `
})
