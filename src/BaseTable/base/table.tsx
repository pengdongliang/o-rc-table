import { ThemeProvider as EmotionThemeProvider } from '@emotion/react'
import { createImmutable } from '@rc-component/context'
import type { CompareProps } from '@rc-component/context/lib/Immutable'
import { internals } from '@src/BaseTable'
import { useDeepCompareEffect, useGetState } from 'ahooks'
import cx from 'classnames'
import { getRichVisibleRectsStream } from 'o-rc-table/base/helpers/getRichVisibleRectsStream'
import React, {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { BehaviorSubject, noop, Subject, Subscription } from 'rxjs'
import * as op from 'rxjs/operators'

import type { ColumnType } from '../interfaces'
import { browserType } from '../utils'
import { calculateRenderInfo } from './calculations'
import type { BaseTableContextProps } from './context'
import { BaseTableContext } from './context'
import { EmptyHtmlTable } from './empty'
import TableHeader from './header'
import { getFullRenderRange, makeRowHeightManager } from './helpers/rowHeightManager'
import { TableDOMHelper } from './helpers/TableDOMUtils'
import { HtmlTable } from './html-table'
import type {
  GetComponent,
  RenderInfo,
  ResolvedUseVirtual,
  TableComponents,
  VerticalRenderRange,
  VirtualEnum,
} from './interfaces'
import getTableRenderTemplate from './renderTemplates'
import { BaseTableCSSVariables, getTableClasses, LOCK_SHADOW_PADDING, StyledArtTableWrapper } from './styles'
import {
  addResizeObserver,
  getScrollbarSize,
  getTableScrollFooterDOM,
  getTableScrollHeaderDOM,
  getValue,
  OVERSCAN_SIZE,
  STYLED_REF_PROP,
  sum,
  syncScrollLeft,
  throttledWindowResize$,
} from './utils'

export type RowKey<RecordType = unknown> = string | keyof RecordType | ((record: RecordType) => React.Key)

export interface BaseTableProps<RecordType = any> {
  /** 主键 */
  rowKey?: RowKey<RecordType>
  /** 表格展示的数据源 */
  dataSource: RecordType[]
  /** 表格页脚数据源 */
  footerDataSource?: any[]
  /** 表格的列配置 */
  columns: ColumnType<RecordType>[]
  /**
   * @description 命名空间
   * @default o-rc-table
   */
  namespace?: BaseTableContextProps['namespace']

  /** 是否开启虚拟滚动 */
  useVirtual?: VirtualEnum | { horizontal?: VirtualEnum; vertical?: VirtualEnum; header?: VirtualEnum }
  /** 虚拟滚动开启情况下，表格中每一行的预估高度 */
  estimatedRowHeight?: number
  /** 表格头部是否置顶，默认为 true */
  isStickyHeader?: boolean
  /** 表格置顶后，距离顶部的距离 */
  stickyTop?: number
  /** 表格页脚是否置底，默认为 true */
  isStickyFooter?: boolean
  /** 表格页脚置底后，距离底部的距离 */
  stickyBottom?: number
  /** 自定义类名 */
  className?: string
  /** 自定义内联样式 */
  style?: CSSProperties & BaseTableCSSVariables
  /** 表格是否具有头部 */
  showHeader?: boolean
  /** 表格是否具有横向的粘性滚动条 */
  hasStickyScroll?: boolean
  /** 横向粘性滚动条高度 */
  stickyScrollHeight?: 'auto' | number
  /** 表格滚动条的宽度 */
  scrollbarWidth?: number
  /** 使用来自外层 div 的边框代替单元格的外边框 */
  useOuterBorder?: boolean
  /** 显示表格单元格边框线 */
  bordered?: boolean

  /** 表格是否在加载中 */
  loading?: boolean
  /** 数据为空时，单元格的高度 */
  emptyCellHeight?: number
  /** @deprecated 数据为空时，表格的展示内容。请使用 components.EmptyContent 代替 */
  emptyContent?: ReactNode

  /** 覆盖表格内部用到的组件 */
  components?: TableComponents

  /** 列的默认宽度 */
  defaultColumnWidth?: number

  /** 虚拟滚动调试标签，用于表格内部调试使用 */
  virtualDebugLabel?: string

  /**
   * @description 自动虚拟阈值
   * @default 80
   */
  autoVirtualThreshold?: number

  /** 行高管理器 */
  rowHeightManager?: any

  /** 设置行属性 */
  onRow?(record: any, rowIndex: number): React.HTMLAttributes<HTMLTableRowElement>

  /** 设置头部行属性 */
  onHeaderRow?(columns: ColumnType<RecordType>[], index: number): React.HTMLAttributes<HTMLTableRowElement>

  getTableProps?(): React.HTMLAttributes<HTMLTableElement>

  setTableWidth?(tableWidth: number): void

  setTableDomHelper?(domHelper: TableDOMHelper): void
  setRowHeightManager?(rowHeightManager: any): void
  // css变量兼容
  cssVariables?: { [key: string]: any }
  enableCSSVariables?: boolean

  scrollLoad?: {
    /** 表格滚动加载回调 */
    callback(startIndex: number): void
    /** 每个数据块的数据条数 */
    blockSize?: number
  }
}

export type BaseTableRef = {
  nativeElement: HTMLDivElement
  scrollTo: (config: { index?: number; key?: React.Key; top?: number }) => void
}

const BaseTable = (props: BaseTableProps, ref: React.Ref<BaseTableRef>) => {
  const {
    setTableWidth,
    setTableDomHelper,
    setRowHeightManager,
    stickyScrollHeight = 'auto',
    stickyTop = 0,
    showHeader = true,
    estimatedRowHeight = 40,
    dataSource = [],
    components = {},
    footerDataSource = [],
    onRow = noop as unknown as BaseTableProps['onRow'],
    rowKey,
    stickyBottom = 0,
    hasStickyScroll = true,
    scrollbarWidth,
    className,
    style,
    useOuterBorder = true,
    isStickyHeader = true,
    isStickyFooter = true,
    getTableProps = noop as BaseTableProps['getTableProps'],
    bordered,
    namespace = 'o-rc-table',
    loading,
    emptyCellHeight,
    virtualDebugLabel,
  } = props
  const props$ = useRef<BehaviorSubject<BaseTableProps>>(new BehaviorSubject(props))
  const domHelper = useRef<TableDOMHelper>(null)
  const lastInfo = useRef<RenderInfo>(null)
  const rowHeightManager = useRef(makeRowHeightManager(dataSource?.length, estimatedRowHeight))
  const artTableWrapperRef = useRef<HTMLDivElement>(null)
  const rootSubscription = useRef<Subscription>(null)
  const resizeSubject = useRef<Subject<unknown>>(null)
  const hozScrollSubject = useRef<Subject<number>>(null)
  const resizeObserver = useRef<ResizeObserver>(null)
  const [, setForceUpdate] = useState(false)
  const lastHasScroll = useRef(true)
  const [, setHasScroll, getHasScroll] = useGetState(true)
  const [hasScrollY, setHasScrollY, getHasScrollY] = useGetState(true)
  const [needRenderLock, setNeedRenderLock] = useState(true)
  const [offsetY, setOffsetY] = useState<number>(0)
  const [offsetX, setOffsetX, getOffsetX] = useGetState<number>(0)
  // 因为 ResizeObserver 在一开始总是会调用一次所提供的回调函数
  // 故这里为 maxRenderHeight/maxRenderWidth 设置一个默认值即可（因为这两个默认值很快就会被覆盖）
  // https://stackoverflow.com/questions/60026223/does-resizeobserver-invokes-initially-on-page-load
  const [maxRenderHeight, setMaxRenderHeight] = useState<number>(600)
  const [maxRenderWidth, setMaxRenderWidth] = useState<number>(800)

  // ==================== Customize =====================
  const getComponent = React.useCallback<GetComponent>(
    (path, defaultComponent) => getValue(components, path) || defaultComponent,
    [components]
  )

  const contextValue = useMemo(() => {
    return {
      namespace,
      Classes: getTableClasses(namespace),
      getComponent,
    }
  }, [getComponent, namespace])

  const getScrollBarWidth = useCallback(() => {
    return scrollbarWidth || getScrollbarSize().width
  }, [scrollbarWidth])

  /**
   * 自定义滚动条宽度为table宽度，使滚动条滑块宽度相同
   */
  const updateStickyScroll = useCallback(() => {
    const { stickyScroll, artTable, stickyScrollItem } = domHelper.current

    if (!artTable) {
      return
    }
    const tableBodyHtmlTable = domHelper.current.getTableBodyHtmlTable()
    const innerTableWidth = tableBodyHtmlTable.offsetWidth
    const artTableWidth = artTable.offsetWidth

    const newStickyScrollHeight = stickyScrollHeight === 'auto' ? getScrollBarWidth() : stickyScrollHeight

    // 设置滚动条高度
    // stickyScroll.style.marginTop = `-${stickyScrollHeight + 1}px`
    stickyScroll.style.height = `${stickyScrollHeight}px`

    if (artTableWidth >= innerTableWidth) {
      if (getHasScroll()) {
        setHasScroll(false)
        lastHasScroll.current = true
      }
    } else if (!getHasScroll() && newStickyScrollHeight > 5) {
      // 考虑下mac下面隐藏滚动条的情况
      setHasScroll(true)
      lastHasScroll.current = false
    }

    if (domHelper.current?.virtual.offsetHeight > domHelper.current?.tableBody.offsetHeight) {
      setHasScrollY(true)
    } else {
      setHasScrollY(false)
    }
    // if (_lastHasScrollY !== getHasScrollY()) {
    //   setTableWidth?.(domHelper.current?.tableBody?.clientWidth)
    // }

    // 设置子节点宽度
    stickyScrollItem.style.width = `${innerTableWidth + (getHasScrollY() ? getScrollBarWidth() : 0)}px`
  }, [stickyScrollHeight, getScrollBarWidth, getHasScroll, getHasScrollY, setHasScroll, setHasScrollY])

  const renderTableHeader = useCallback(
    (info: RenderInfo) => {
      const renderHeader = getTableRenderTemplate('header')
      if (typeof renderHeader === 'function') {
        return renderHeader(info, props)
      }

      const stickyRightOffset = getHasScrollY() ? getScrollBarWidth() : 0

      return (
        <div
          className={cx(contextValue.Classes?.tableHeader, contextValue.Classes?.tableHeaderNoScrollbar)}
          style={{
            top: stickyTop === 0 ? undefined : stickyTop,
            display: showHeader ? undefined : 'none',
          }}
        >
          <TableHeader info={info} stickyRightOffset={stickyRightOffset} />
          <div
            className={contextValue.Classes?.verticalScrollPlaceholder}
            style={getHasScrollY() ? { width: getScrollBarWidth() } : undefined}
          />
        </div>
      )
    },
    [
      contextValue.Classes?.tableHeader,
      contextValue.Classes?.tableHeaderNoScrollbar,
      contextValue.Classes?.verticalScrollPlaceholder,
      getScrollBarWidth,
      showHeader,
      getHasScrollY,
      props,
      stickyTop,
    ]
  )

  const updateOffsetX = useCallback(
    (nextOffsetX: number) => {
      if (lastInfo.current.useVirtual.horizontal) {
        if (Math.abs(nextOffsetX - getOffsetX()) >= OVERSCAN_SIZE / 2) {
          setOffsetX(nextOffsetX)
        }
      }
    },
    [getOffsetX, setOffsetX]
  )

  const syncHorizontalScroll = useCallback(
    (x: number) => {
      updateOffsetX(x)

      const { flat } = lastInfo.current

      const leftLockShadow = domHelper.current.getLeftLockShadow()
      if (leftLockShadow) {
        const shouldShowLeftLockShadow = flat.left.length > 0 && needRenderLock && x > 0
        if (shouldShowLeftLockShadow) {
          leftLockShadow.classList.add('show-shadow')
        } else {
          leftLockShadow.classList.remove('show-shadow')
        }
      }

      const rightLockShadow = domHelper.current.getRightLockShadow()
      if (rightLockShadow) {
        const shouldShowRightLockShadow =
          flat.right.length > 0 &&
          needRenderLock &&
          x < domHelper.current.virtual.scrollWidth - domHelper.current.virtual.clientWidth
        if (shouldShowRightLockShadow) {
          rightLockShadow.classList.add('show-shadow')
        } else {
          rightLockShadow.classList.remove('show-shadow')
        }
      }
    },
    [needRenderLock, updateOffsetX]
  )

  const syncHorizontalScrollFromTableBody = useCallback(() => {
    hozScrollSubject.current.next(domHelper.current?.virtual.scrollLeft)
  }, [])

  const getVerticalRenderRange = useCallback(
    (virtualParams: ResolvedUseVirtual): VerticalRenderRange => {
      const rowCount = dataSource.length
      if (virtualParams.vertical) {
        return rowHeightManager.current.getRenderRange(offsetY, maxRenderHeight, rowCount)
      }
      return getFullRenderRange(rowCount)
    },
    [dataSource.length, maxRenderHeight, offsetY]
  )

  const handleRowMouseEnter = useCallback((e: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
    const nodeList = domHelper.current.getRowNodeListByEvent(e)
    nodeList &&
      nodeList.forEach((node) => {
        node.classList.add('row-hover')
      })
  }, [])

  const handleRowMouseLeave = useCallback((e: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
    const nodeList = domHelper.current.getRowNodeListByEvent(e)
    nodeList &&
      nodeList.forEach((node) => {
        node.classList.remove('row-hover')
      })
  }, [])

  const renderTableBody = useCallback(
    (info: RenderInfo) => {
      const tableBodyClassName = cx(contextValue.Classes?.tableBody, contextValue.Classes?.horizontalScrollContainer)

      // 低版本Edge浏览器下也会出现双滚动条，这里设置overflow: 'hidden'，先去掉edge的方向键控制滚动条的功能
      const virtualStyle = browserType.isIE || browserType.isEdge ? { overflow: 'hidden' } : {}

      if (dataSource.length === 0) {
        const { EmptyContent } = components ?? {}

        return (
          <div className={cx(tableBodyClassName, contextValue.Classes?.tableBodyEmpty)}>
            <div className={contextValue.Classes?.virtual} tabIndex={-1} style={virtualStyle}>
              <EmptyHtmlTable
                descriptors={info.visible}
                loading={loading}
                EmptyContent={EmptyContent}
                emptyCellHeight={emptyCellHeight}
              />
            </div>
          </div>
        )
      }

      const { topIndex, bottomBlank, topBlank, bottomIndex } = info.verticalRenderRange
      const stickyRightOffset = getHasScrollY() ? getScrollBarWidth() : 0

      const renderBody = getTableRenderTemplate('body')
      if (typeof renderBody === 'function') {
        return renderBody(info, props, {
          rowProps: { onMouseEnter: handleRowMouseEnter, onMouseLeave: handleRowMouseLeave },
          stickyRightOffset,
        })
      }

      return (
        <div className={tableBodyClassName}>
          <div className={contextValue.Classes?.virtual} tabIndex={-1} style={virtualStyle}>
            {topBlank > 0 && (
              <div
                key="top-blank"
                className={cx(contextValue.Classes?.virtualBlank, 'top')}
                style={{ height: topBlank }}
              />
            )}
            <HtmlTable
              tbodyHtmlTag="tbody"
              onRow={onRow}
              rowKey={rowKey}
              data={dataSource.slice(topIndex, bottomIndex)}
              stickyRightOffset={stickyRightOffset}
              horizontalRenderInfo={info}
              verticalRenderInfo={{
                first: 0,
                offset: topIndex,
                limit: bottomIndex,
                last: dataSource.length - 1,
              }}
            />
            {bottomBlank > 0 && (
              <div
                key="bottom-blank"
                className={cx(contextValue.Classes?.virtualBlank, 'bottom')}
                style={{ height: bottomBlank }}
              />
            )}
          </div>
        </div>
      )
    },
    [
      components,
      contextValue.Classes?.horizontalScrollContainer,
      contextValue.Classes?.tableBody,
      contextValue.Classes?.tableBodyEmpty,
      contextValue.Classes?.virtual,
      contextValue.Classes?.virtualBlank,
      dataSource,
      emptyCellHeight,
      onRow,
      getScrollBarWidth,
      handleRowMouseEnter,
      handleRowMouseLeave,
      getHasScrollY,
      loading,
      props,
      rowKey,
    ]
  )

  const renderTableFooter = useCallback(
    (info: RenderInfo) => {
      const renderFooter = getTableRenderTemplate('footer')
      if (typeof renderFooter === 'function') {
        return renderFooter(info, props, {
          rowProps: { onMouseEnter: handleRowMouseEnter, onMouseLeave: handleRowMouseLeave },
        })
      }

      return (
        <div
          className={cx(contextValue.Classes?.tableFooter, contextValue.Classes?.horizontalScrollContainer)}
          style={{ bottom: stickyBottom === 0 ? undefined : stickyBottom }}
        >
          <HtmlTable
            tbodyHtmlTag="tfoot"
            data={footerDataSource}
            horizontalRenderInfo={info}
            onRow={onRow}
            rowKey={rowKey}
            verticalRenderInfo={{
              offset: 0,
              first: 0,
              last: footerDataSource.length - 1,
              limit: Infinity,
            }}
          />
          {footerDataSource.length > 0 ? (
            <div
              className={contextValue.Classes?.verticalScrollPlaceholder}
              style={getHasScrollY() ? { width: getScrollBarWidth(), visibility: 'initial' } : undefined}
            />
          ) : null}
        </div>
      )
    },
    [
      contextValue.Classes?.horizontalScrollContainer,
      contextValue.Classes?.tableFooter,
      contextValue.Classes?.verticalScrollPlaceholder,
      footerDataSource,
      onRow,
      getScrollBarWidth,
      handleRowMouseEnter,
      handleRowMouseLeave,
      getHasScrollY,
      props,
      rowKey,
      stickyBottom,
    ]
  )

  const renderLockShadows = useCallback(
    (info: RenderInfo) => {
      const stickyRightOffset = getHasScrollY() ? getScrollBarWidth() : 0

      return (
        <>
          <div
            className={contextValue.Classes?.lockShadowMask}
            style={{ left: 0, width: info.leftLockTotalWidth + LOCK_SHADOW_PADDING }}
          >
            <div className={cx(contextValue.Classes?.lockShadow, contextValue.Classes?.leftLockShadow)} />
          </div>
          <div
            className={contextValue.Classes?.lockShadowMask}
            style={{ right: 0, width: info.rightLockTotalWidth + LOCK_SHADOW_PADDING + stickyRightOffset }}
          >
            <div className={cx(contextValue.Classes?.lockShadow, contextValue.Classes?.rightLockShadow)} />
          </div>
        </>
      )
    },
    [
      contextValue.Classes?.leftLockShadow,
      contextValue.Classes?.lockShadow,
      contextValue.Classes?.lockShadowMask,
      contextValue.Classes?.rightLockShadow,
      getScrollBarWidth,
      getHasScrollY,
    ]
  )

  const renderStickyScroll = useCallback(() => {
    return (
      <div
        className={cx(
          contextValue.Classes?.horizontalScrollContainer,
          contextValue.Classes?.horizontalStickyScrollContainer
        )}
      >
        <div
          className={cx(contextValue.Classes?.stickyScroll)}
          style={{
            display: hasStickyScroll && getHasScroll() ? 'block' : 'none',
            bottom: stickyBottom,
          }}
        >
          <div className={contextValue.Classes?.stickyScrollItem} />
        </div>
      </div>
    )
  }, [
    contextValue.Classes?.horizontalScrollContainer,
    contextValue.Classes?.horizontalStickyScrollContainer,
    contextValue.Classes?.stickyScroll,
    contextValue.Classes?.stickyScrollItem,
    getHasScroll,
    hasStickyScroll,
    stickyBottom,
  ])

  const updateRowHeightManager = useCallback(() => {
    const virtualTop = domHelper.current.getVirtualTop()
    const virtualTopHeight = virtualTop?.clientHeight ?? 0

    let maxTrRowIndex = -1
    let maxTrBottom = -1
    let zeroHeightRowCount = 0

    for (const tr of domHelper.current.getTableRows()) {
      const rowIndex = Number(tr.dataset.rowindex)
      if (Number.isNaN(rowIndex)) {
        continue
      }
      maxTrRowIndex = Math.max(maxTrRowIndex, rowIndex)
      const offset = tr.offsetTop + virtualTopHeight
      const size = tr.offsetHeight
      if (size === 0) {
        zeroHeightRowCount += 1
      } else {
        // 渲染出来的行高度为0，说明是display=none情况，行高不存在该种异常情况，不保存当前的高度
        rowHeightManager.current.updateRow(rowIndex, offset, size)
      }
      maxTrBottom = Math.max(maxTrBottom, offset + size)
    }

    // 当 estimatedRowHeight 过大时，可能出现「渲染行数过少，无法覆盖可视范围」的情况
    // 出现这种情况时，我们判断「下一次渲染能够渲染更多行」是否满足，满足的话就直接调用 forceUpdate
    // zeroHeightRowCount === 0 用于确保当前没有 display=none 的情况
    if (maxTrRowIndex !== -1 && zeroHeightRowCount === 0) {
      if (maxTrBottom < offsetY + maxRenderHeight) {
        const vertical = getVerticalRenderRange(lastInfo.current.useVirtual)
        if (vertical.bottomIndex - 1 > maxTrRowIndex) {
          setForceUpdate((v) => !v)
        }
      }
    }
  }, [getVerticalRenderRange, maxRenderHeight, offsetY])

  /**
   * 计算表格所有列的渲染宽度之和，判断表格是否需要渲染锁列
   */
  const adjustNeedRenderLock = useCallback(() => {
    const { flat, hasLockColumn } = lastInfo.current

    if (hasLockColumn) {
      const sumOfColWidth = sum(flat.full.map((col) => col.width as number))
      const nextNeedRenderLock = sumOfColWidth > domHelper.current.artTable.clientWidth
      if (needRenderLock !== nextNeedRenderLock) {
        setNeedRenderLock(nextNeedRenderLock)
      }
    } else if (needRenderLock) {
      setNeedRenderLock(false)
    }
  }, [needRenderLock])

  useDeepCompareEffect(() => {
    if (domHelper.current) {
      if (domHelper.current.stickyScroll) {
        domHelper.current.stickyScroll.scrollLeft = 0
      }
      if (domHelper.current.tableBody) {
        domHelper.current.tableBody.scrollTop = 0
      }
    }
  }, [dataSource])

  const updateScrollLeftWhenLayoutChanged = useCallback(
    (prevProps?: Readonly<BaseTableProps>) => {
      // if (prevProps != null) {
      //   if (!lastHasScroll.current && getHasScroll() && !getHasScrollY()) {
      //     domHelper.current.stickyScroll.scrollLeft = 0
      //   }
      // }

      if (prevProps != null) {
        const prevHasFooter = prevProps.footerDataSource?.length > 0
        const currentHasFooter = footerDataSource.length > 0
        if (!prevHasFooter && currentHasFooter) {
          getTableScrollFooterDOM(domHelper.current).scrollLeft = domHelper.current.virtual.scrollLeft
        }
      }
    },
    [footerDataSource.length]
  )

  const didMountOrUpdate = useCallback(
    (prevProps?: Readonly<BaseTableProps>) => {
      syncHorizontalScrollFromTableBody()
      updateStickyScroll()
      adjustNeedRenderLock()
      updateRowHeightManager()
      updateScrollLeftWhenLayoutChanged(prevProps)
    },
    [
      adjustNeedRenderLock,
      syncHorizontalScrollFromTableBody,
      updateRowHeightManager,
      updateScrollLeftWhenLayoutChanged,
      updateStickyScroll,
    ]
  )

  const initSubscriptions = useCallback(() => {
    const { virtual, stickyScroll } = domHelper.current
    rootSubscription.current.add(
      throttledWindowResize$.subscribe(() => {
        updateStickyScroll()
        adjustNeedRenderLock()
      })
    )

    resizeSubject.current.pipe(op.debounceTime(100)).subscribe(() => {
      setTableWidth?.(domHelper.current.tableBody.clientWidth)
    })

    hozScrollSubject.current.pipe(op.debounceTime(20)).subscribe((nextOffsetX) => {
      syncHorizontalScroll(nextOffsetX)
    })

    const handleTableWrapperResize = () => {
      resizeSubject.current.next()
    }

    resizeObserver.current = addResizeObserver(domHelper.current.artTableWrapper, handleTableWrapperResize)

    // 滚动同步
    rootSubscription.current.add(
      syncScrollLeft(
        [getTableScrollHeaderDOM(domHelper.current), virtual, getTableScrollFooterDOM(domHelper.current), stickyScroll],
        (scrollLeft) => {
          hozScrollSubject.current.next(scrollLeft)
        }
      )
    )

    const richVisibleRects$ = getRichVisibleRectsStream(
      domHelper.current.virtual,
      props$.current.pipe(op.skip(1), op.mapTo('structure-may-change')),
      virtualDebugLabel
    ).pipe(op.shareReplay())

    // 每当可见部分发生变化的时候，调整 loading icon 的未知（如果 loading icon 存在的话）
    // rootSubscription.current.add(
    //   combineLatest([
    //     richVisibleRects$.pipe(
    //       op.map((p) => p.clipRect),
    //       op.distinctUntilChanged(shallowEqual)
    //     ),
    //     props$.current.pipe(
    //       op.startWith(null as any),
    //       op.pairwise(),
    //       op.filter(([prevProps, curProps]) => prevProps == null || (!prevProps.loading && curProps.loading))
    //     ),
    //   ]).subscribe(([clipRect]) => {
    //     const loadingIndicator = domHelper.current.getLoadingIndicator()
    //     if (!loadingIndicator) {
    //       return
    //     }
    //     const height = clipRect.bottom - clipRect.top
    //     // f ixme 这里的定位在有些特殊情况下可能会出错
    //     loadingIndicator.style.top = `${height / 2}px`
    //     loadingIndicator.style.marginTop = `${height / 2}px`
    //   })
    // )

    // 每当可见部分发生变化的时候，如果开启了虚拟滚动，则重新触发 render
    rootSubscription.current.add(
      richVisibleRects$
        .pipe(
          op.filter(() => {
            const { horizontal, vertical } = lastInfo.current.useVirtual
            return horizontal || vertical
          }),
          op.map(({ clipRect, offsetY: y }) => {
            return {
              maxRenderHeight: clipRect.bottom - clipRect.top,
              maxRenderWidth: clipRect.right - clipRect.left,
              offsetY: y,
            }
          }),
          op.distinctUntilChanged((x, y) => {
            // 如果表格区域被隐藏， 不需要触发组件重渲染
            if (y.maxRenderHeight === 0 && y.maxRenderWidth === 0) {
              return true
            }
            // 因为 overscan 的存在，滚动较小的距离时不需要触发组件重渲染
            return (
              Math.abs(x.maxRenderWidth - y.maxRenderWidth) < OVERSCAN_SIZE / 2 &&
              Math.abs(x.maxRenderHeight - y.maxRenderHeight) < OVERSCAN_SIZE / 2 &&
              Math.abs(x.offsetY - y.offsetY) < OVERSCAN_SIZE / 2
            )
          })
        )
        .subscribe((ops) => {
          setMaxRenderHeight(ops?.maxRenderHeight)
          setMaxRenderWidth(ops?.maxRenderWidth)
          setOffsetY(ops?.offsetY)
        })
    )

    // rootSubscription.current.add(
    //   richVisibleRects$
    //     .pipe(
    //       op.map(({ clipRect, offsetY: y }) => ({
    //         maxRenderHeight: clipRect.bottom - clipRect.top,
    //         maxRenderWidth: clipRect.right - clipRect.left,
    //         offsetY: y,
    //       })),
    //       op.distinctUntilChanged((x, y) => {
    //         return x.offsetY - y.offsetY === 0
    //       }),
    //       // 计算得到当前行索引对应的数据块，blocks改成数组的形式，兼容快速拖动可视区域出现两个数据块的情况
    //       op.map((sizeAndOffset) => {
    //         const { offsetY: y, maxRenderHeight: h } = sizeAndOffset
    //         const scrollDirection = y - offsetY >= 0 ? 'down' : 'up'
    //         setOffsetY(y)
    //
    //         const rowCount = dataSource.length
    //         const vertical = rowHeightManager.current.getRenderRange(offsetY, h, rowCount)
    //         const { topIndex, bottomIndex } = vertical
    //         const blockSize = scrollLoad?.blockSize || 200
    //
    //         const topBlockStartIndex = Math.floor(Math.max(topIndex - 1, 0) / blockSize) * blockSize
    //         const bottomBlockStartIndex = Math.floor((bottomIndex + 1) / blockSize) * blockSize
    //         return scrollDirection === 'down'
    //           ? [topBlockStartIndex, bottomBlockStartIndex]
    //           : [bottomBlockStartIndex, topBlockStartIndex]
    //       }),
    //       op.distinctUntilChanged((x, y) => {
    //         return x[0] === y[0] && x[1] === y[1]
    //       }),
    //       op.switchMap((startIndexs) => {
    //         const event$ = from(startIndexs)
    //         return event$.pipe(op.map((startIndex) => startIndex))
    //       }),
    //       // 过滤掉重复掉值
    //       op.distinctUntilChanged()
    //     )
    //     .subscribe((startIndex) => {
    //       scrollLoad?.callback(startIndex)
    //     })
    // )
  }, [adjustNeedRenderLock, setTableWidth, syncHorizontalScroll, updateStickyScroll, virtualDebugLabel])

  /**
   * 更新 DOM 节点的引用，方便其他方法直接操作 DOM
   */
  const updateDOMHelper = useCallback(() => {
    if (artTableWrapperRef.current) {
      domHelper.current = new TableDOMHelper(artTableWrapperRef.current, getTableClasses(namespace))
    }
  }, [namespace])

  const info = useMemo(() => {
    return calculateRenderInfo({
      ...props,
      offsetX,
      maxRenderWidth,
      getVerticalRenderRange,
      useVirtual: props?.useVirtual ?? 'auto',
    })
  }, [getVerticalRenderRange, maxRenderWidth, offsetX, props])

  const artTableWrapperClassName = useMemo(() => {
    return cx(
      namespace,
      {
        [contextValue.Classes?.outerBorder]: useOuterBorder,
        [contextValue.Classes?.lockWrapper]: info.hasLockColumn,
        [contextValue.Classes?.showHeader]: showHeader,
        [contextValue.Classes?.stickyHeader]: isStickyHeader,
        [contextValue.Classes?.hasFooter]: footerDataSource.length > 0,
        [contextValue.Classes?.stickyFooter]: isStickyFooter,
        [contextValue.Classes?.artTableBordered]: bordered,
        [contextValue.Classes?.iePolyfillWrapper]: browserType.isIE,
      },
      className
    )
  }, [
    bordered,
    className,
    contextValue.Classes?.artTableBordered,
    contextValue.Classes?.hasFooter,
    contextValue.Classes?.showHeader,
    contextValue.Classes?.iePolyfillWrapper,
    contextValue.Classes?.lockWrapper,
    contextValue.Classes?.outerBorder,
    contextValue.Classes?.stickyFooter,
    contextValue.Classes?.stickyHeader,
    footerDataSource.length,
    showHeader,
    info.hasLockColumn,
    isStickyFooter,
    isStickyHeader,
    namespace,
    useOuterBorder,
  ])

  useEffect(() => {
    lastInfo.current = info
  }, [info])

  useEffect(() => {
    rootSubscription.current = new Subscription()
    resizeSubject.current = new Subject()
    hozScrollSubject.current = new Subject()
    updateDOMHelper()

    props$.current = new BehaviorSubject(props)
    initSubscriptions()
    didMountOrUpdate()
    // const { cssVariables, enableCSSVariables, bordered } = props
    // cssPolifill({ variables: cssVariables || {}, enableCSSVariables, bordered })
    setTableDomHelper?.(domHelper.current)
    setRowHeightManager?.(rowHeightManager)

    return () => {
      resizeObserver.current?.disconnect()
      rootSubscription.current.unsubscribe()
      resizeSubject.current.unsubscribe()
      hozScrollSubject.current.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // const { cssVariables, enableCSSVariables, bordered } = props
    // if (!shallowEqual(prevProps?.cssVariables, props?.cssVariables)) {
    //   cssPolifill({ variables: cssVariables || {}, enableCSSVariables, bordered })
    // }
    updateDOMHelper()
    props$.current.next(props)
    didMountOrUpdate(props$.current.getValue())
  }, [didMountOrUpdate, props, updateDOMHelper])

  useEffect(() => {
    setTableWidth?.(domHelper.current.tableBody.clientWidth)
  }, [hasScrollY, setTableWidth])

  useImperativeHandle(ref, () => {
    return {
      nativeElement: artTableWrapperRef.current,
      scrollTo: (config: Record<string, any>) => {
        if (domHelper.current instanceof HTMLElement) {
          const { index, top, key } = config

          if (top) {
            domHelper.current?.scrollTo({
              top,
            })
          } else {
            const mergedKey = key ?? internals.safeGetRowKey(rowKey, dataSource, index)
            domHelper.current.querySelector(`[data-row-key="${mergedKey}"]`)?.scrollIntoView()
          }
        } else if ((domHelper.current as any)?.scrollTo) {
          ;(domHelper.current as any).scrollTo(config)
        }
      },
    }
  })

  const artTableWrapperProps = {
    className: artTableWrapperClassName,
    style,
    [STYLED_REF_PROP]: artTableWrapperRef,
  }

  const tableProps = getTableProps?.() || {}

  return (
    <BaseTableContext.Provider value={contextValue}>
      <EmotionThemeProvider theme={contextValue}>
        <StyledArtTableWrapper {...artTableWrapperProps}>
          {Object.keys(contextValue.Classes).length > 0 && (
            <>
              <div {...tableProps} className={cx(getTableClasses(namespace)?.artTable, tableProps.className)}>
                {renderTableHeader(info)}
                {renderTableBody(info)}
                {footerDataSource?.length > 0 && renderTableFooter(info)}
                {renderLockShadows(info)}
              </div>
              {renderStickyScroll()}
            </>
          )}
        </StyledArtTableWrapper>
      </EmotionThemeProvider>
    </BaseTableContext.Provider>
  )
}

const { makeImmutable } = createImmutable()

export type ForwardGenericTable = (<RecordType extends Record<string, any> = any>(
  props: BaseTableProps<RecordType> & { ref?: React.Ref<BaseTableRef> }
) => React.ReactElement) & {
  displayName?: string
}

const RefTable = React.forwardRef(BaseTable) as unknown as ForwardGenericTable

if (process.env.NODE_ENV !== 'production') {
  RefTable.displayName = 'BaseTable'
}

export function genTable(shouldTriggerRender?: CompareProps<typeof BaseTable>) {
  return makeImmutable(RefTable, shouldTriggerRender) as ForwardGenericTable
}

export default RefTable
