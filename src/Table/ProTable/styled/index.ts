import { css, Theme } from '@emotion/react'
import styled from '@emotion/styled'

export const TableContainerStyled = styled.div(({ theme }) => {
  const { namespace, antdTheme } = theme

  return css`
    .${namespace}-table-container {
      .white__space--pre {
        white-space: pre;
      }

      .table-editable-cell {
        position: relative;
      }

      .table-editable-cell-value-wrap {
        padding: 5px ${antdTheme?.token?.paddingContentHorizontal}px;
        cursor: pointer;
      }

      .table-editable-row:hover .table-editable-cell-value-wrap {
        padding: 4px ${antdTheme?.token?.paddingContentHorizontal - 1}px;
        border: 1px solid ${antdTheme?.token?.colorBorder ?? '#d9d9d9'};
        border-radius: ${antdTheme?.token?.borderRadius}px;
      }

      [data-theme='dark'] .table-editable-row:hover .table-editable-cell-value-wrap {
        border: 1px solid ${theme?.hoverBorderDarkColor ?? '#434343'};
      }

      .${theme?.namespace || 'ant'}-table-cell {
        .${theme?.namespace || 'ant'}-typography {
          user-select: none;
        }
      }

      .${namespace}-table-thead, .${namespace}-table-tbody {
        & > tr {
          & > th {
            font-size: ${antdTheme.token.fontSize - 2}px;
            font-weight: 580;
          }

          & > .${namespace}-table-cell {
            &.${namespace}-table-cell_text_align_center {
              text-align: center;

              .${namespace}-btn-icon {
                margin: 0;
              }
            }
          }
        }
      }

      .${namespace}-table-tbody {
        & > tr.${namespace}-table-row {
          td {
            .expand-icon {
              font-size: 12px;

              &:hover {
                color: ${antdTheme.token.colorPrimary};
              }
            }

            .table-more-actions_btn {
              height: 21px;
              line-height: initial;
              border: none;

              .${namespace}-icon-more {
                font-size: 15px;
                font-weight: bold;
              }
            }
          }

          &.${namespace}-table-row_even {
            td {
              background-color: #fcfcfc;
            }
          }

          &:hover {
            td {
              background-color: #f8f8f8;
            }
          }
        }

        .${namespace}-table-expanded-row-fixed {
          height: 100%;
          background-color: #fff;

          &:after {
            border: 0;
          }

          td {
            background-color: ${antdTheme.components.Table?.headerBg};
          }
        }
      }
    }

    .${namespace}-table-pagination {
      .${namespace}-pagination-item {
        border-color: #bdbdbd;
      }

      .${namespace}-pagination-item-active {
        background-color: ${antdTheme?.token?.colorPrimary};
        border-color: ${antdTheme?.token?.colorPrimary};

        a {
          color: #fff;
        }
      }

      .${namespace}-pagination-prev, .${namespace}-pagination-next {
        .${namespace}-pagination-item-link {
          width: 100%;
          height: 100%;
          padding: 0;
          font-size: 12px;
          text-align: center;
          background-color: transparent;
          border: 1px solid #bdbdbd;
          border-radius: 4px;
          outline: none;
          transition: border 0.2s;
        }
      }

      .${namespace}-pagination-options {
        .${namespace}-pagination-options-size-changer {
          height: ${antdTheme?.components?.Pagination?.controlHeight}px;

          .${namespace}-select-selection-item {
            line-height: ${antdTheme?.components?.Pagination?.controlHeight}px;
          }
        }

        .${namespace}-pagination-options-quick-jumper {
          input {
            padding: 0px 2px;
            text-align: center;
            font-size: 12px;
          }
        }
      }
    }

    * {
      ::-webkit-scrollbar-track {
        border-radius: 0;
        background-color: #f1f1f1;
      }
    }
  `
})

export const moreActionsCellStyle = (antdTheme: Theme['antdTheme']) => css`
  .table-more-actions_box {
    & > ul {
      padding-left: 0 !important;
      padding-right: 0 !important;

      li {
        padding: 0 !important;
        height: ${antdTheme?.token?.controlHeight}px;

        &:hover {
          background-color: ${antdTheme?.token?.controlItemBgHover} !important;
        }

        & > span {
          height: 100%;

          & > button {
            height: 100% !important;
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
        }
      }
    }
  }
`
