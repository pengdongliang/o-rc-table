import { css } from '@emotion/react'
import styled from '@emotion/styled'

import type { BaseTableContextProps } from '.'

export const LOCK_SHADOW_PADDING = 20

export const getTableClasses = (prefix = 'o-rc-table') => {
  const MenuClasses = {
    menu: `${prefix}-menu`,
    menuList: `${prefix}-menu-list`,
    menuOption: `${prefix}-menu-option`,
    menuOptionActive: `${prefix}-menu-option-active`,
    menuOptionDisable: `${prefix}-menu-option-disable`,
    menuOptionText: `${prefix}-menu-option-text`,
  }

  return {
    ...MenuClasses,
    // ============================= wrapper =============================
    /** BaseTable 表格组件的外层包裹 div */
    artTableWrapper: `${prefix}-wrapper`,
    /** 单元格边框 */
    artTableBordered: `${prefix}-bordered`,
    /** 有表头 */
    showHeader: `${prefix}-has-header`,
    /** 具有sticky头部 */
    stickyHeader: `${prefix}-sticky-header`,
    /** 有表尾 */
    hasFooter: `${prefix}-has-footer`,
    /** sticky表尾 */
    stickyFooter: `${prefix}-sticky-footer`,
    /** 是IE */
    iePolyfillWrapper: `${prefix}-ie-polyfill-wrapper`,
    /** 使用来自外层 div 的边框代替单元格的外边框 */
    outerBorder: `${prefix}-use-outer-border`,
    /** 包含有效的锁列 */
    lockWrapper: `${prefix}-fixed-wrapper`,
    // ============================= wrapper =============================

    artTable: `${prefix}-container`,
    tableHeaderMain: `${prefix}-header-main`,
    tableHeader: `${prefix}-header`,
    /** 表格标题无滚动条 */
    tableHeaderNoScrollbar: `${prefix}-header-no-scrollbar`,
    tableBody: `${prefix}-body`,
    tableDom: `${prefix}-dom`,
    tableBodyEmpty: `${prefix}-body-empty`,
    tableBodyTbody: `${prefix}-tbody`,
    virtual: `${prefix}-virtual`,
    tableFooter: `${prefix}-footer`,
    tableFooterMain: `${prefix}-footer-main`,
    tableSummary: `${prefix}-summary`,

    /** 表格行 */
    tableRow: `${prefix}-row`,
    /** 表头thead */
    tableHeaderThead: `${prefix}-thead`,
    /** 表头行 */
    tableHeaderRow: `${prefix}-header-row`,
    /** 单元格 */
    tableCell: `${prefix}-cell`,
    /** 单元格内容 */
    tableCellContent: `${prefix}-cell-content`,
    /** 表头的单元格 */
    tableHeaderCell: `${prefix}-header-cell`,
    tableHeaderCellContent: `${prefix}-header-cell-content`,
    tableHeaderCellResize: `${prefix}-header-cell-resize`,
    /** 单元格省略 */
    tableCellEllipsis: `${prefix}-cell-ellipsis`,
    virtualBlank: `${prefix}-virtual-blank`,

    stickyScroll: `${prefix}-sticky-scroll`,
    stickyScrollItem: `${prefix}-sticky-scroll-item`,
    horizontalScrollContainer: `${prefix}-horizontal-scroll-container`,
    verticalScrollPlaceholder: `${prefix}-vertical-scroll-placeholder`,
    horizontalStickyScrollContainer: `${prefix}-horizontal-sticky-scroll-container`,

    lockShadowMask: `${prefix}-fixed-shadow-mask`,
    lockShadow: `${prefix}-fixed-shadow`,
    leftLockShadow: `${prefix}-left-fixed-shadow`,
    rightLockShadow: `${prefix}-right-fixed-shadow`,

    /** 数据为空时表格内容的外层 div */
    emptyWrapper: `${prefix}-empty-wrapper`,
    emptyImg: `${prefix}-empty-image`,
    emptyDesc: `${prefix}-empty-description`,

    loadingWrapper: `${prefix}-loading-wrapper`,
    loadingContentWrapper: `${prefix}-loading-content-wrapper`,
    loadingIndicatorWrapper: `${prefix}-loading-indicator-wrapper`,
    loadingIndicator: `${prefix}-loading-indicator`,

    tableHeaderCellLine: `${prefix}-table-header-cell-line`,

    tableFilterTrigger: `${prefix}-filter-trigger`,
    tableSortIcon: `${prefix}-sort-icon`,
    tableExtendIcon: `${prefix}-extend-icon`,

    button: `${prefix}-btn`,
    buttonPrimary: `${prefix}-btn-primary`,
    filterIcon: `${prefix}-filter-icon`,

    rangeSelection: `${prefix}-range-selection`,
    tableCellRangeSingleCell: `${prefix}-cell-range-single-cell`,
    tableCellRangeSelected: `${prefix}-cell-range-selected`,
    tableCellRangeTop: `${prefix}-cell-range-top`,
    tableCellRangeLeft: `${prefix}-cell-range-left`,
    tableCellRangeBottom: `${prefix}-cell-range-bottom`,
    tableCellRangeRight: `${prefix}-cell-range-right`,

    rowDetailContainer: `${prefix}-row-detail-container`,
    rowDetailItem: `${prefix}-row-detail-item`,

    emptyColCell: `${prefix}-empty-col-cell`,

    first: `${prefix}-first`,
    last: `${prefix}-last`,
    even: `${prefix}-row_even`,
    odd: `${prefix}-row_odd`,

    fixedLeft: `${prefix}-fixed-left`,
    fixedRight: `${prefix}-fixed-right`,
    fixedLeftLast: `${prefix}-cell-fix-left-last`,
    fixedRightFirst: `${prefix}-cell-fix-right-first`,

    rowSpan: `${prefix}-row-span`,
    leaf: `${prefix}-leaf`,

    // ================= expand ==================
    expandRowFixed: `${prefix}-expanded-row-fixed`,
    expandIcon: `${prefix}-row-expand-icon`,
    expanded: `${prefix}-row-expand-icon-expanded`,
    collapsed: `${prefix}-row-expand-icon-collapsed`,
    isExpandContentRow: `${prefix}-is-expand-content-row`,
    expandSpaced: `${prefix}-row-expand-icon-spaced`,
    // ================= expand ==================

    popup: `${prefix}-popup`,
    popupHeader: `${prefix}-popup-header`,
    popupBody: `${prefix}-popup-body`,

    rowDragging: `${prefix}-row-dragging`,

    rowDragStart: `${prefix}-row-drag-start`,
    rowDragEnd: `${prefix}-row-drag-end`,
    rowDragEndToTop: `${prefix}-row-drag-end-to-top`,
    rowDragEndToBottom: `${prefix}-row-drag-end-to-bottom`,
    rowDragElement: `${prefix}-row-drag-element`,
    rowDragCell: `${prefix}-row-drag-cell`,
  }
}

const Z = {
  fixed: 5,
  header: 15,
  footer: 10,
  lockShadow: 20,
  rowDetail: 25,
  scrollItem: 30,
  loadingIndicator: 40,
} as const

export type BaseTableCSSVariables = Partial<{
  /** 表格一行的高度，注意该属性将被作为 CSS variable，不能使用数字作为简写 */
  '--row-height': string
  /** 表格的字体颜色 */
  '--color': string
  /** 表格背景颜色 */
  '--bgcolor': string
  /** 鼠标悬停时的背景色 */
  '--hover-bgcolor': string
  /** 单元格高亮时的背景色 */
  '--highlight-bgcolor': string
  /** 主题色 */
  '--primary-color': string

  /** 主题色浅色1，浅色选中、悬浮 */
  '--primary-color-level1': string
  /** 主题色浅色2，深色选中、悬浮 */
  '--primary-color-level2': string
  /** 图标默认颜色 */
  '--icon-color': string
  /** 边框颜色 */
  '--strong-border-color': string

  /** 表头中一行的高度，注意该属性将被作为 CSS variable，不能使用数字作为简写 */
  '--header-row-height': string
  /** 表头中的字体颜色 */
  '--header-color': string
  /** 表头的背景色 */
  '--header-bgcolor': string
  /** 表头上鼠标悬停时的背景色 */
  '--header-hover-bgcolor': string
  /** 表头上单元格高亮时的背景色 */
  '--header-highlight-bgcolor': string

  /** 单元格 padding */
  '--cell-padding': string
  '--expand-fixed-margin': string
  /** 字体大小 */
  '--font-size': string
  /** 表格内字体的行高 */
  '--line-height': string
  /** 锁列阴影，默认为 rgba(152, 152, 152, 0.5) 0 0 6px 2px */
  '--fixed-shadow': string

  /** 单元格的边框颜色 */
  '--border-color': string
  /** 单元格边框，默认为 1px solid #dfe3e8 */
  '--cell-border': string
  /** 单元格上下边框，默认为 1px solid #dfe3e8 */
  '--cell-border-vertical': string
  /** 单元格左右边框，默认为 1px solid #dfe3e8 */
  '--cell-border-horizontal': string
  /** 表头单元格边框，默认为 1px solid #dfe3e8 */
  '--header-cell-border': string
  /** 表头单元格左右边框，默认为 1px solid #dfe3e8 */
  '--header-cell-border-horizontal': string
  /** 表头单元格上下边框，默认为 none ，默认值为 1px solid #dfe3e8 */
  '--header-cell-border-vertical': string
}>

const outerBorderStyleMixin = (Classes: BaseTableContextProps['Classes']) => css`
  border-top: 1px solid #e7e7e7;
  border-inline-end: 1px solid #e7e7e7;
  border-bottom: 1px solid #e7e7e7;
  border-left: 1px solid #e7e7e7;

  td.${Classes?.first}, th.${Classes?.first} {
    border-left: none;
  }

  td.${Classes?.last}, th.${Classes?.last} {
    border-inline-end: none;
  }

  thead tr.${Classes?.first} th,
  tbody tr.${Classes?.first} td {
    border-top: none;
  }

  &.${Classes?.hasFooter} tfoot tr.${Classes?.last} td {
    border-bottom: none;
  }

  &:not(.${Classes?.hasFooter}) tbody tr.${Classes?.last} td {
    border-bottom: none;
  }

  td.${Classes?.rowSpan}:not(.${Classes?.first}) {
    border-left: var(--cell-border-horizontal);
  }

  td.${Classes?.rowSpan}:not(.${Classes?.last}) {
    border-inline-end: var(--cell-border-horizontal);
  }
`

export const defaultCSSVariables: BaseTableCSSVariables = {
  '--row-height': '48px',
  '--color': '#333',
  '--bgcolor': 'white',
  '--hover-bgcolor': 'var(--hover-color, #f5f5f5)',
  '--highlight-bgcolor': '#eee',
  '--primary-color': '#5582F3',
  '--primary-color-level1': 'rgb(242, 248, 255)',
  '--primary-color-level2': 'rgb(135, 173, 255)',
  '--icon-color': '#666666',
  '--strong-border-color': '#d9d9d9',

  '--header-row-height': '32px',
  '--header-color': '#333',
  '--header-bgcolor': '#f4f4f4',
  '--header-hover-bgcolor': '#ddd',
  '--header-highlight-bgcolor': '#e4e8ed',

  '--cell-padding': '8px 12px',
  '--expand-fixed-margin': '-8px -12px',
  '--font-size': '12px',
  '--line-height': '1.28571',
  '--fixed-shadow': 'rgba(152, 152, 152, 0.5) 0 0 6px 2px',

  '--border-color': '#dfe3e8',
  '--cell-border': '1px solid #dfe3e8',
  '--cell-border-vertical': '1px solid #dfe3e8',
  '--cell-border-horizontal': '1px solid #dfe3e8',
  '--header-cell-border': '1px solid #dfe3e8',
  '--header-cell-border-horizontal': '1px solid #dfe3e8',
  '--header-cell-border-vertical': '1px solid #dfe3e8',
}

export const variableConst = getCssVariableText(defaultCSSVariables)

export const StyledArtTableWrapper = styled.div(({ theme }) => {
  const { Classes = {}, antdTheme } = theme

  return css`
    ${variableConst}
    * {
      box-sizing: border-box;
    }

    position: relative;
    filter: none;
    overflow: auto;
    display: flex;
    flex-direction: column;

    // 表格外边框由 o-rc-table-wrapper 提供，而不是由单元格提供

    &.${Classes?.outerBorder} {
      ${outerBorderStyleMixin(Classes)};
    }

    .${Classes?.tableHeaderNoScrollbar} {
      ::-webkit-scrollbar {
        display: none;
      }
    }

    .${Classes?.artTable} {
      overflow: auto;
      flex-shrink: 1;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }

    .${Classes?.tableHeader} {
      overflow: hidden;
      background: var(--header-bgcolor);
      display: flex;
      flex-shrink: 0;
      //border-bottom: var(--header-cell-border-vertical);
    }

    .${Classes?.tableHeaderCellContent} {
      display: flex;
      // justify-content: flex-start;
      align-items: center;
      height: initial;
    }

    .${Classes?.virtual} {
      overflow-x: auto;
      flex-shrink: 0;
      flex-grow: 0;
      scrollbar-width: none; // 兼容火狐

      & {
        ::-webkit-scrollbar {
          display: none;
        }
      }
    }

    .${Classes?.tableFooter} {
      display: flex;
      flex: none;

      &.${Classes?.tableSummary} {
        border: none;
      }
    }

    .${Classes?.tableBody} {
      height: 100%;
    }

    .${Classes?.tableRow} {
      position: relative;
    }

    .${Classes?.tableBody}, .${Classes?.tableFooter} {
      background: var(--bgcolor);
      overflow: auto;
      overflow-x: hidden;
      overflow-anchor: none;
      position: relative;

      &.${Classes?.tableSummary} {
        overflow: hidden;
      }

      &.empty {
        position: relative;
      }

      .${Classes?.tableCellRangeSelected} {
        background-color: #e6effb !important;
      }

      .${Classes?.tableCellRangeTop} {
        border-top: 1px solid #0e5fd8 !important;
      }

      .${Classes?.tableCellRangeLeft} {
        border-left: 1px solid #0e5fd8 !important;
      }

      .${Classes?.tableCellRangeBottom} {
        border-bottom: 1px solid #0e5fd8 !important;
      }

      .${Classes?.tableCellRangeRight} {
        border-inline-end: 1px solid #0e5fd8 !important;
      }
    }

    .${Classes?.rangeSelection} {
      user-select: none;
    }

    .${Classes?.rowDragging} {
      user-select: none;

      .${Classes?.tableBody} .${Classes?.tableRow} > td {
        cursor: move;
      }

      .${Classes?.tableFooter} .${Classes?.tableRow} > td {
        cursor: no-drop;
      }
    }

    .${Classes?.rowDragStart} {
      opacity: 0.5;
    }

    .${Classes?.rowDragEndToTop}::after {
      content: '';
      position: absolute;
      display: block;
      left: 0px;
      width: 100%;
      height: 1px;
      top: 0px;
      z-index: 20;
      background-color: var(--primary-color);
    }

    .${Classes?.rowDragEndToBottom}::after {
      content: '';
      position: absolute;
      display: block;
      left: 0px;
      width: 100%;
      height: 1px;
      bottom: 0px;
      z-index: 20;
      background-color: var(--primary-color);
    }

    .${Classes?.rowDragCell} {
      cursor: pointer;
    }

    &.sticky-header .${Classes?.tableHeader} {
      position: sticky;
      top: 0;
      z-index: ${Z.header};
    }

    &.sticky-footer .${Classes?.tableFooter} {
      position: sticky;
      bottom: 0;
      z-index: ${Z.footer};
    }

    table {
      width: 0;
      table-layout: fixed;
      border-collapse: separate;
      border-spacing: 0;
      display: table;
      margin: 0;
      padding: 0;
      flex-shrink: 0;
      flex-grow: 0;
      position: relative;
    }

    // 展开内容样式

    .${Classes?.isExpandContentRow} {
      z-index: 21;
    }

    // 在 tr 上设置 .no-hover 可以禁用鼠标悬停效果

    tr:not(.no-hover):hover > td {
      background: var(--hover-bgcolor);
    }

    // 使用 js 添加悬浮效果

    tr:not(.no-hover).row-hover > td {
      background: var(--hover-bgcolor);
    }

    // 在 tr 设置 highlight 可以为底下的 td 设置为高亮色
    // 而设置 .no-highlight 的话则可以禁用高亮效果；

    tr:not(.no-highlight).highlight > td {
      background: var(--highlight-bgcolor);
    }

    th {
      font-weight: normal;
      text-align: left;
      padding: var(--cell-padding);
      height: var(--header-row-height);
      color: var(--header-color);
      background: var(--header-bgcolor);
      border-bottom: var(--header-cell-border-vertical);
      position: relative;
    }

    // th.${Classes?.leaf} {
    //   border-bottom: none;
    // }

    tr.${Classes?.first} th {
      border-top: var(--header-cell-border-vertical);
    }

    th.${Classes?.first} {
      border-left: var(--header-cell-border-horizontal);
    }

    td {
      padding: var(--cell-padding);
      background: var(--bgcolor);
      //height: var(--row-height);
      border-bottom: var(--cell-border-vertical);
      word-break: break-all;
    }

    .${Classes?.emptyColCell} td {
      border-bottom: none;
    }

    &.${Classes?.artTableBordered} {
      th {
        border-inline-end: var(--header-cell-border-horizontal);
      }

      td {
        border-inline-end: var(--cell-border-horizontal);
      }
    }

    td.${Classes?.first} {
      border-left: var(--cell-border-horizontal);
    }

    tr.${Classes?.first} td {
      border-top: var(--cell-border-vertical);
    }

    &.has-header tbody tr.${Classes?.first} td {
      border-top: none;
    }

    &.has-footer tbody tr.${Classes?.last} td {
      border-bottom: none;
    }

    tr.${Classes?.even} {
      td {
        background-color: #fcfcfc;
      }
    }

    //#region 锁列阴影

    .${Classes?.lockShadowMask} {
      position: absolute;
      top: 0;
      bottom: 0;
      z-index: ${Z.lockShadow};
      pointer-events: none;
      overflow: hidden;

      .${Classes?.lockShadow} {
        height: 100%;
      }

      .${Classes?.leftLockShadow} {
        margin-right: ${LOCK_SHADOW_PADDING}px;
        box-shadow: none;

        &.show-shadow {
          box-shadow: var(--fixed-shadow);
          //border-inline-end: var(--cell-border-horizontal);
        }
      }

      .${Classes?.rightLockShadow} {
        margin-left: ${LOCK_SHADOW_PADDING}px;
        box-shadow: none;

        &.show-shadow {
          box-shadow: var(--fixed-shadow);
          //border-left: var(--cell-border-horizontal);
        }
      }
    }

    //#endregion

    // ================ elliepsis ================

    .${Classes?.tableCellEllipsis} {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      word-break: keep-all;

      &.${Classes?.fixedLeftLast}, &.${Classes?.fixedRightFirst} {
        overflow: visible;

        .${Classes?.tableCellContent} {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    //#region 空表格展现

    .${Classes?.emptyWrapper} {
      pointer-events: none;
      color: #99a3b3;
      font-size: 12px;
      text-align: center;
      position: absolute;
      left: 50%;
      top: 30px;
      transform: translateX(-50%);

      .${Classes.emptyImg} {
        margin-bottom: 8px;

        svg {
          max-width: 100%;
          height: 100%;
          margin: auto;
        }
      }

      .${Classes.emptyDesc} {
        color: rgba(0, 0, 0, 0.25);
      }
    }

    //#endregion

    // fixed

    .${Classes?.fixedLeft}, .${Classes?.fixedRight} {
      z-index: ${Z.fixed};
    }

    .${Classes?.fixedLeftLast}, .${Classes?.fixedRightFirst} {
      overflow: visible;

      &::after {
        position: absolute;
        top: 0;
        right: 0;
        bottom: -1px;
        width: 30px;
        transform: translateX(100%);
        transition: box-shadow 0.3s;
        content: '';
        pointer-events: none;
      }
    }

    .${Classes?.fixedLeftLast} {
      &::after {
        box-shadow: inset 10px 0 8px -8px rgba(5, 5, 5, 0.06);
      }
    }

    .${Classes?.fixedRightFirst} {
      &::after {
        top: 0;
        bottom: -1px;
        left: 0;
        width: 30px;
        transform: translateX(-100%);
        box-shadow: inset -10px 0 8px -8px rgba(5, 5, 5, 0.06);
      }
    }

    //#region IE兼容

    &.ie-polyfill-wrapper {
      //锁定列兼容 仅在锁定列的情况下生效

      .${Classes?.virtual} {
        overflow-x: hidden;
      }

      .${Classes?.tableBody}, .${Classes?.tableFooter} {
        position: relative;
      }

      .${Classes?.tableHeaderMain} {
        overflow: hidden;
      }

      .${Classes?.tableHeader} {
        position: relative;
      }

      .${Classes?.tableFooterMain} {
        overflow: auto;
        overflow-x: hidden;
        overflow-anchor: none;
      }

      .${Classes?.fixedLeft}, .${Classes?.fixedRight} {
        position: absolute;
        z-index: ${Z.fixed};
        top: 0;
      }

      .${Classes?.fixedLeft} {
        left: 0;

        &:after {
          box-shadow: inset 10px 0 8px -8px rgba(5, 5, 5, 0.06);
        }
      }

      .${Classes?.fixedRight} {
        right: 0;
      }

      .${Classes?.rowDetailContainer} {
        .${Classes?.rowDetailItem} {
          position: absolute;
          top: 0;
          width: 100%;
          z-index: ${Z.rowDetail};
        }
      }

      tr:not(.no-hover).row-hover > td {
        background: var(--hover-bgcolor);
      }
    }

    //#endregion

    // =============== expand ===============

    .${Classes?.expandRowFixed} {
      margin: var(--expand-fixed-margin);
    }

    //#region 粘性滚动条

    .${Classes?.horizontalStickyScrollContainer} {
      display: flex;
      background: var(--bgcolor);
    }

    .${Classes?.stickyScroll} {
      overflow-y: hidden;
      overflow-x: auto;
      z-index: ${Z.scrollItem};
      flex-shrink: 1;
      flex-grow: 0;
      border-top: 1px solid var(--border-color);
    }

    .${Classes?.stickyScrollItem} {
      // 必须有高度才能出现滚动条
      height: 1px;
      visibility: hidden;
    }

    //#endregion

    //#region 表格过滤

    .${Classes?.tableFilterTrigger} {
      color: var(--icon-color);

      &.active {
        color: var(--primary-color);
      }

      padding: 6px 4px;

      &:hover {
        background-color: #e5e5e5;
      }

      &:focus {
        outline: none;
      }
    }

    //#endregion

    //#region 表格排序

    .${Classes?.tableSortIcon} {
      color: var(--icon-color);

      &.active {
        color: var(--primary-color);
      }
    }

    .${Classes?.tableExtendIcon} {
      color: var(--icon-color);

      &.active {
        color: var(--primary-color);
      }
    }

    //#endregion

    //#region 滚动条占位

    .${Classes?.verticalScrollPlaceholder} {
      flex-shrink: 0;
      z-index: ${Z.fixed + 1};
      position: sticky;
      right: 0;
      right: 0;
      background-color: ${(antdTheme as any)?.components?.Table?.headerBg ?? 'var(--header-bgcolor)'};
    }

    .${Classes?.tableFooter} .${Classes?.verticalScrollPlaceholder} {
      border-top: var(--cell-border-vertical);
    }

    //#endregion

    //#region 拖拽列宽大小

    &:not(.${Classes?.artTableBordered}) {
      .${Classes?.tableHeaderCellResize}::after {
        background-color: var(--border-color);
      }
    }

    //解决部分浏览器(chrome109)最后一个单元格的列宽拖拽区域绝对定位超出表格，导致表格竖分割线无法对齐

    .${Classes?.tableHeaderRow} th.${Classes?.last} .${Classes?.tableHeaderCellResize} {
      right: 0;
      width: 5px;

      &::after {
        left: 4px;
      }
    }

    //#endregion
  `
})
export const ButtonCSS = (Classes: BaseTableContextProps['Classes']) => css`
  ${variableConst}
  //#region 按钮
  .${Classes?.button} {
    color: var(--color);
    background: #ffffff;
    border: 1px solid var(--strong-border-color);
    border-radius: 2px;
    cursor: pointer;

    &:hover {
      color: var(--primary-color);
      border: 1px solid var(--primary-color);
    }
  }

  .${Classes?.buttonPrimary} {
    color: #ffffff;
    background-color: var(--primary-color);
    border: none;

    &:hover {
      color: #ffffff;
      background-color: var(--primary-color-level2);
      border: none;
    }
  }

  //#endregion
`

interface VariableObj {
  [key: string]: string | number
}

function getCssVariableText(obj: VariableObj) {
  return Object.keys(obj).reduce((acc, key) => {
    acc += `${key}:${obj[key]};`
    return acc
  }, '')
}
