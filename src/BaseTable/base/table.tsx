/* eslint-disable */
import cx from 'classnames'
import React, { CSSProperties, ReactNode } from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import { BehaviorSubject, combineLatest, from, noop, Subject, Subscription } from 'rxjs'
import * as op from 'rxjs/operators'

import { ArtColumn } from '../interfaces'
import { browserType, console } from '../utils'
import { calculateRenderInfo } from './calculations'
import { EmptyHtmlTable } from './empty'
import TableHeader from './header'
import { getRichVisibleRectsStream } from './helpers/getRichVisibleRectsStream'
import { getFullRenderRange, makeRowHeightManager } from './helpers/rowHeightManager'
import { TableDOMHelper } from './helpers/TableDOMUtils'
import { HtmlTable } from './html-table'
import { RenderInfo, ResolvedUseVirtual, VerticalRenderRange, VirtualEnum } from './interfaces'
import getTableRenderTemplate from './renderTemplates'
import { BaseTableCSSVariables, Classes, LOCK_SHADOW_PADDING, prefix, StyledArtTableWrapper } from './styles'
import {
  addResizeObserver,
  // cssPolifill,
  getScrollbarSize,
  getTableScrollFooterDOM,
  getTableScrollHeaderDOM,
  OVERSCAN_SIZE,
  shallowEqual,
  STYLED_REF_PROP,
  sum,
  syncScrollLeft,
  throttledWindowResize$,
} from './utils'

export type PrimaryKey = string | ((record: any) => string)

export interface BaseTableProps {
  /** 主键 */
  primaryKey?: PrimaryKey
  /** 表格展示的数据源 */
  dataSource: any[]
  /** 表格页脚数据源 */
  footerDataSource?: any[]
  /** 表格的列配置 */
  columns: ArtColumn[]

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
  hasHeader?: boolean
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
  components?: {
    /** 数据为空时，表格的展示内容。 */
    EmptyContent?: React.ComponentType
  }

  /** 列的默认宽度 */
  defaultColumnWidth?: number

  /**
   * @deprecated
   * flowRoot 在表格 v2.4 后不再需要提供，请移除该属性
   * */
  flowRoot?: never

  /** 虚拟滚动调试标签，用于表格内部调试使用 */
  virtualDebugLabel?: string

  getRowProps?(record: any, rowIndex: number): React.HTMLAttributes<HTMLTableRowElement>

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

export interface BaseTableState {
  /** 是否要展示自定义滚动条(stickyScroll) */
  hasScroll: boolean

  /** 是否存在纵向滚动条 */
  hasScrollY: boolean

  /** 是否需要渲染 lock sections
   * 当表格较宽时，所有的列都能被完整的渲染，此时不需要渲染 lock sections
   * 只有当「整个表格的宽度」小于「每一列渲染宽度之和」时，lock sections 才需要被渲染 */
  needRenderLock: boolean

  /** 纵向虚拟滚动偏移量 */
  offsetY: number
  /** 纵向虚拟滚动 最大渲染尺寸 */
  maxRenderHeight: number
  /** 横向虚拟滚动偏移量 */
  offsetX: number
  /** 横向虚拟滚动 最大渲染尺寸 */
  maxRenderWidth: number
}

export class BaseTable extends React.Component<BaseTableProps, BaseTableState> {
  static defaultProps = {
    hasHeader: true,
    isStickyHeader: true,
    stickyTop: 0,

    footerDataSource: [] as any[],
    isStickyFooter: true,
    stickyBottom: 0,
    hasStickyScroll: true,
    stickyScrollHeight: 'auto',

    useVirtual: 'auto',
    estimatedRowHeight: 48,

    loading: false,
    components: {},
    getTableProps: noop,
    getRowProps: noop,
    dataSource: [] as any[],

    useOuterBorder: true,
  }

  private rowHeightManager = makeRowHeightManager(this.props.dataSource.length, this.props.estimatedRowHeight)

  private artTableWrapperRef = React.createRef<HTMLDivElement>()

  private domHelper: TableDOMHelper

  private rootSubscription: Subscription

  private resizeSubject: Subject<unknown>

  // 最近一次渲染的计算结果缓存
  private lastInfo: RenderInfo

  private props$: BehaviorSubject<BaseTableProps>

  private hasScrollY = false

  private resizeObserver?: ResizeObserver

  private offsetY = 0

  /** @deprecated BaseTable.getDoms() 已经过时，请勿调用 */
  getDoms() {
    console.warn('[o-rc-table] BaseTable.getDoms() 已经过时')
    return this.domHelper
  }

  constructor(props: Readonly<BaseTableProps>) {
    super(props)

    this.state = {
      hasScroll: true,
      hasScrollY: true,
      needRenderLock: true,
      offsetY: 0,
      offsetX: 0,
      // 因为 ResizeObserver 在一开始总是会调用一次所提供的回调函数
      // 故这里为 maxRenderHeight/maxRenderWidth 设置一个默认值即可（因为这两个默认值很快就会被覆盖）
      // https://stackoverflow.com/questions/60026223/does-resizeobserver-invokes-initially-on-page-load
      maxRenderHeight: 600,
      maxRenderWidth: 800,
    }
  }

  /** 自定义滚动条宽度为table宽度，使滚动条滑块宽度相同 */
  private updateStickyScroll() {
    const { stickyScroll, artTable, stickyScrollItem } = this.domHelper
    const _lastHasScrollY = this.hasScrollY
    if (!artTable) {
      return
    }
    const tableBodyHtmlTable = this.domHelper.getTableBodyHtmlTable()
    const innerTableWidth = tableBodyHtmlTable.offsetWidth
    const artTableWidth = artTable.offsetWidth

    const stickyScrollHeightProp = this.props.stickyScrollHeight
    const stickyScrollHeight = stickyScrollHeightProp === 'auto' ? this.getScrollBarWidth() : stickyScrollHeightProp

    // stickyScroll.style.marginTop = `-${stickyScrollHeight + 1}px`
    // 设置滚动条高度
    stickyScroll.style.height = `${stickyScrollHeight}px`

    if (artTableWidth >= innerTableWidth) {
      if (this.state.hasScroll) {
        this.setState({ hasScroll: false })
      }
    } else if (!this.state.hasScroll && stickyScrollHeight > 5) {
      // 考虑下mac下面隐藏滚动条的情况
      this.setState({ hasScroll: true })
    }
    if (this.domHelper.virtual.offsetHeight > this.domHelper.tableBody.offsetHeight) {
      this.hasScrollY = true
    } else {
      this.hasScrollY = false
    }
    if (_lastHasScrollY !== this.hasScrollY) {
      this.props.setTableWidth?.(this.domHelper.tableBody.clientWidth)
    }
    console.log(111111, this.state.hasScroll, this.hasScrollY,this.getScrollBarWidth())
    // 设置子节点宽度
    stickyScrollItem.style.width = `${innerTableWidth + (this.hasScrollY ? this.getScrollBarWidth() : 0)}px`
  }

  private renderTableHeader(info: RenderInfo) {
    const { stickyTop, hasHeader } = this.props
    const renderHeader = getTableRenderTemplate('header')
    if (typeof renderHeader === 'function') {
      return renderHeader(info, this.props)
    }
    return (
      <div
        className={cx(Classes.tableHeader, Classes.tableHeaderNoScrollbar)}
        style={{
          top: stickyTop === 0 ? undefined : stickyTop,
          display: hasHeader ? undefined : 'none',
        }}
      >
        <TableHeader info={info} />
        <div
          className={Classes.verticalScrollPlaceholder}
          style={this.hasScrollY ? { width: this.getScrollBarWidth() } : undefined}
        />
      </div>
    )
  }

  private updateOffsetX(nextOffsetX: number) {
    if (this.lastInfo.useVirtual.horizontal) {
      if (Math.abs(nextOffsetX - this.state.offsetX) >= OVERSCAN_SIZE / 2) {
        this.setState({ offsetX: nextOffsetX })
      }
    }
  }

  private syncHorizontalScrollFromTableBody() {
    this.syncHorizontalScroll(this.domHelper.virtual.scrollLeft)
  }

  /** 同步横向滚动偏移量 */
  private syncHorizontalScroll(x: number) {
    this.updateOffsetX(x)

    const { flat } = this.lastInfo

    const leftLockShadow = this.domHelper.getLeftLockShadow()
    if (leftLockShadow) {
      const shouldShowLeftLockShadow = flat.left.length > 0 && this.state.needRenderLock && x > 0
      if (shouldShowLeftLockShadow) {
        leftLockShadow.classList.add('show-shadow')
      } else {
        leftLockShadow.classList.remove('show-shadow')
      }
    }

    const rightLockShadow = this.domHelper.getRightLockShadow()
    if (rightLockShadow) {
      const shouldShowRightLockShadow =
        flat.right.length > 0 &&
        this.state.needRenderLock &&
        x < this.domHelper.virtual.scrollWidth - this.domHelper.virtual.clientWidth
      if (shouldShowRightLockShadow) {
        rightLockShadow.classList.add('show-shadow')
      } else {
        rightLockShadow.classList.remove('show-shadow')
      }
    }
  }

  getVerticalRenderRange(useVirtual: ResolvedUseVirtual): VerticalRenderRange {
    const { dataSource } = this.props
    const { offsetY, maxRenderHeight } = this.state
    const rowCount = dataSource.length
    if (useVirtual.vertical) {
      return this.rowHeightManager.getRenderRange(offsetY, maxRenderHeight, rowCount)
    }
    return getFullRenderRange(rowCount)
  }

  private handleRowMouseEnter = (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
    const nodeList = this.domHelper.getRowNodeListByEvent(e)
    nodeList &&
    nodeList.forEach((node) => {
      node.classList.add('row-hover')
    })
  }

  private handleRowMouseLeave = (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
    const nodeList = this.domHelper.getRowNodeListByEvent(e)
    nodeList &&
    nodeList.forEach((node) => {
      node.classList.remove('row-hover')
    })
  }

  private renderTableBody = (info: RenderInfo) => {
    const { dataSource, getRowProps, primaryKey, loading, emptyCellHeight } = this.props
    const tableBodyClassName = cx(Classes.tableBody, Classes.horizontalScrollContainer)

    // 低版本Edge浏览器下也会出现双滚动条，这里设置overflow: 'hidden'，先去掉edge的方向键控制滚动条的功能
    const virtualStyle = browserType.isIE || browserType.isEdge ? { overflow: 'hidden' } : {}

    if (dataSource.length === 0) {
      const { components } = this.props
      let { EmptyContent } = components

      return (
        <div className={cx(tableBodyClassName, Classes.tableBodyEmpty)}>
          <div className={Classes.virtual} tabIndex={-1} style={virtualStyle}>
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
    const stickyRightOffset = this.hasScrollY ? this.getScrollBarWidth() : 0

    const renderBody = getTableRenderTemplate('body')
    if (typeof renderBody === 'function') {
      return renderBody(info, this.props, {
        rowProps: { onMouseEnter: this.handleRowMouseEnter, onMouseLeave: this.handleRowMouseLeave },
        stickyRightOffset,
      })
    }

    return (
      <div className={tableBodyClassName}>
        <div className={Classes.virtual} tabIndex={-1} style={virtualStyle}>
          {topBlank > 0 && (
            <div key="top-blank" className={cx(Classes.virtualBlank, 'top')} style={{ height: topBlank }} />
          )}
          <HtmlTable
            tbodyHtmlTag="tbody"
            getRowProps={getRowProps}
            primaryKey={primaryKey}
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
            <div key="bottom-blank" className={cx(Classes.virtualBlank, 'bottom')} style={{ height: bottomBlank }} />
          )}
        </div>
      </div>
    )
  }

  private renderTableFooter(info: RenderInfo) {
    const { footerDataSource = [], getRowProps, primaryKey, stickyBottom } = this.props

    const renderFooter = getTableRenderTemplate('footer')
    if (typeof renderFooter === 'function') {
      return renderFooter(info, this.props, {
        rowProps: { onMouseEnter: this.handleRowMouseEnter, onMouseLeave: this.handleRowMouseLeave },
      })
    }

    return (
      <div
        className={cx(Classes.tableFooter, Classes.horizontalScrollContainer)}
        style={{ bottom: stickyBottom === 0 ? undefined : stickyBottom }}
      >
        <HtmlTable
          tbodyHtmlTag="tfoot"
          data={footerDataSource}
          horizontalRenderInfo={info}
          getRowProps={getRowProps}
          primaryKey={primaryKey}
          verticalRenderInfo={{
            offset: 0,
            first: 0,
            last: footerDataSource.length - 1,
            limit: Infinity,
          }}
        />
        {footerDataSource.length > 0 ? (
          <div
            className={Classes.verticalScrollPlaceholder}
            style={this.hasScrollY ? { width: this.getScrollBarWidth(), visibility: 'initial' } : undefined}
          />
        ) : null}
      </div>
    )
  }

  private renderLockShadows(info: RenderInfo) {
    // console.log('render LockShadows')
    return (
      <>
        <div
          className={Classes.lockShadowMask}
          style={{ left: 0, width: info.leftLockTotalWidth + LOCK_SHADOW_PADDING }}
        >
          <div className={cx(Classes.lockShadow, Classes.leftLockShadow)} />
        </div>
        <div
          className={Classes.lockShadowMask}
          style={{ right: 0, width: info.rightLockTotalWidth + LOCK_SHADOW_PADDING }}
        >
          <div className={cx(Classes.lockShadow, Classes.rightLockShadow)} />
        </div>
      </>
    )
  }

  private renderStickyScroll(info: RenderInfo) {
    // console.log('render stickyscroll')
    const { hasStickyScroll, stickyBottom } = this.props
    const { hasScroll } = this.state
    return (
      <div className={cx(Classes.horizontalScrollContainer, Classes.horizontalStickyScrollContainer)}>
        <div
          className={cx(Classes.stickyScroll)}
          style={{
            display: hasStickyScroll && hasScroll ? 'block' : 'none',
            bottom: stickyBottom,
          }}
        >
          <div className={Classes.stickyScrollItem} />
        </div>
      </div>
    )
  }

  private getScrollBarWidth() {
    return this.props.scrollbarWidth || getScrollbarSize().width
  }

  render() {
    const info = calculateRenderInfo(this)
    this.lastInfo = info

    const {
      className,
      style,
      hasHeader,
      useOuterBorder,
      isStickyHeader,
      isStickyFooter,
      getTableProps,
      footerDataSource,
      bordered,
    } = this.props

    const artTableWrapperClassName = cx(
      prefix,
      {
        [Classes.outerBorder]: useOuterBorder,
        [Classes.lockWrapper]: info.hasLockColumn,
        [Classes.hasHeader]: hasHeader,
        [Classes.stickyHeader]: isStickyHeader,
        [Classes.hasFooter]: footerDataSource.length > 0,
        [Classes.stickyFooter]: isStickyFooter,
        [Classes.artTableBordered]: bordered,
        [Classes.iePolyfillWrapper]: browserType.isIE,
      },
      className,
    )

    const artTableWrapperProps = {
      className: artTableWrapperClassName,
      style,
      [STYLED_REF_PROP]: this.artTableWrapperRef,
    }

    const tableProps = getTableProps() || {}

    return (
      <StyledArtTableWrapper {...artTableWrapperProps}>
        <div {...tableProps} className={cx(Classes.artTable, tableProps.className)}>
          {this.renderTableHeader(info)}
          {this.renderTableBody(info)}
          {footerDataSource?.length > 0 && this.renderTableFooter(info)}
          {this.renderLockShadows(info)}
        </div>
        {this.renderStickyScroll(info)}
      </StyledArtTableWrapper>
    )
  }

  componentDidMount() {
    this.rootSubscription = new Subscription()
    this.resizeSubject = new Subject()
    this.updateDOMHelper()

    this.props$ = new BehaviorSubject(this.props)
    this.initSubscriptions()
    this.didMountOrUpdate()
    // const { cssVariables, enableCSSVariables, bordered } = this.props
    // cssPolifill({ variables: cssVariables || {}, enableCSSVariables, bordered })
    this.props.setTableWidth?.(this.domHelper.tableBody.clientWidth)
    this.props.setTableDomHelper?.(this.domHelper)
    this.props.setRowHeightManager?.(this.rowHeightManager)
  }

  componentDidUpdate(prevProps: Readonly<BaseTableProps>, prevState: Readonly<BaseTableState>) {
    // const { cssVariables, enableCSSVariables, bordered } = this.props
    // if (!shallowEqual(prevProps?.cssVariables, this.props?.cssVariables)) {
    //   cssPolifill({ variables: cssVariables || {}, enableCSSVariables, bordered })
    // }
    this.updateDOMHelper()
    this.props$.next(this.props)
    this.didMountOrUpdate(prevProps, prevState)
  }

  private didMountOrUpdate(prevProps?: Readonly<BaseTableProps>, prevState?: Readonly<BaseTableState>) {
    this.syncHorizontalScrollFromTableBody()
    this.updateStickyScroll()
    this.adjustNeedRenderLock()
    this.updateRowHeightManager()
    this.updateScrollLeftWhenLayoutChanged(prevProps, prevState)
  }

  private updateScrollLeftWhenLayoutChanged(
    prevProps?: Readonly<BaseTableProps>,
    prevState?: Readonly<BaseTableState>,
  ) {
    if (prevState != null) {
      if (!prevState.hasScroll && this.state.hasScroll) {
        this.domHelper.stickyScroll.scrollLeft = 0
      }
    }

    if (prevProps != null) {
      const prevHasFooter = prevProps.footerDataSource.length > 0
      const currentHasFooter = this.props.footerDataSource.length > 0
      if (!prevHasFooter && currentHasFooter) {
        getTableScrollFooterDOM(this.domHelper).scrollLeft = this.domHelper.virtual.scrollLeft
      }
    }
  }

  private initSubscriptions() {
    const { virtual, stickyScroll } = this.domHelper
    this.rootSubscription.add(
      throttledWindowResize$.subscribe(() => {
        this.updateStickyScroll()
        this.adjustNeedRenderLock()
      }),
    )

    this.resizeSubject.pipe(op.debounceTime(100)).subscribe(() => {
      this.props.setTableWidth?.(this.domHelper.tableBody.clientWidth)
    })

    const handleTableWrapperResize = () => {
      this.resizeSubject.next()
    }

    this.resizeObserver = addResizeObserver(this.domHelper.artTableWrapper, handleTableWrapperResize)

    // 滚动同步
    this.rootSubscription.add(
      syncScrollLeft(
        [getTableScrollHeaderDOM(this.domHelper), virtual, getTableScrollFooterDOM(this.domHelper), stickyScroll],
        (scrollLeft) => {
          this.syncHorizontalScroll(scrollLeft)
        },
      ),
    )

    const richVisibleRects$ = getRichVisibleRectsStream(
      this.domHelper.virtual,
      this.props$.pipe(op.skip(1), op.mapTo('structure-may-change')),
      this.props.virtualDebugLabel,
    ).pipe(op.shareReplay())

    // 每当可见部分发生变化的时候，调整 loading icon 的未知（如果 loading icon 存在的话）
    this.rootSubscription.add(
      combineLatest([
        richVisibleRects$.pipe(
          op.map((p) => p.clipRect),
          op.distinctUntilChanged(shallowEqual),
        ),
        this.props$.pipe(
          op.startWith(null),
          op.pairwise(),
          op.filter(([prevProps, props]) => prevProps == null || (!prevProps.loading && props.loading)),
        ),
      ]).subscribe(([clipRect]) => {
        const loadingIndicator = this.domHelper.getLoadingIndicator()
        if (!loadingIndicator) {
          return
        }
        const height = clipRect.bottom - clipRect.top
        // fixme 这里的定位在有些特殊情况下可能会出错
        loadingIndicator.style.top = `${height / 2}px`
        loadingIndicator.style.marginTop = `${height / 2}px`
      }),
    )

    // 每当可见部分发生变化的时候，如果开启了虚拟滚动，则重新触发 render
    this.rootSubscription.add(
      richVisibleRects$
        .pipe(
          op.filter(() => {
            const { horizontal, vertical } = this.lastInfo.useVirtual
            return horizontal || vertical
          }),
          op.map(({ clipRect, offsetY }) => ({
            maxRenderHeight: clipRect.bottom - clipRect.top,
            maxRenderWidth: clipRect.right - clipRect.left,
            offsetY,
          })),
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
          }),
        )
        .subscribe((sizeAndOffset) => {
          this.setState(sizeAndOffset)
        }),
    )

    this.rootSubscription.add(
      richVisibleRects$
        .pipe(
          op.map(({ clipRect, offsetY }) => ({
            maxRenderHeight: clipRect.bottom - clipRect.top,
            maxRenderWidth: clipRect.right - clipRect.left,
            offsetY,
          })),
          op.distinctUntilChanged((x, y) => {
            return x.offsetY - y.offsetY === 0
          }),
          // 计算得到当前行索引对应的数据块，blocks改成数组的形式，兼容快速拖动可视区域出现两个数据块的情况
          op.map((sizeAndOffset) => {
            const { offsetY, maxRenderHeight } = sizeAndOffset
            const scrollDirection = offsetY - this.offsetY >= 0 ? 'down' : 'up'
            this.offsetY = offsetY

            const rowCount = this.props.dataSource.length
            const vertical = this.rowHeightManager.getRenderRange(offsetY, maxRenderHeight, rowCount)
            const { topIndex, bottomIndex } = vertical
            const blockSize = this.props.scrollLoad?.blockSize || 200

            const topBlockStartIndex = Math.floor(Math.max(topIndex - 1, 0) / blockSize) * blockSize
            const bottomBlockStartIndex = Math.floor((bottomIndex + 1) / blockSize) * blockSize
            return scrollDirection === 'down'
              ? [topBlockStartIndex, bottomBlockStartIndex]
              : [bottomBlockStartIndex, topBlockStartIndex]
          }),
          op.distinctUntilChanged((x, y) => {
            return x[0] === y[0] && x[1] === y[1]
          }),
          op.switchMap((startIndexs) => {
            const event$ = from(startIndexs)
            return event$.pipe(op.map((startIndex) => startIndex))
          }),
          // 过滤掉重复掉值
          op.distinctUntilChanged(),
        )
        .subscribe((startIndex) => {
          this.props.scrollLoad?.callback(startIndex)
        }),
    )
  }

  componentWillUnmount() {
    this.resizeObserver?.disconnect()
    this.rootSubscription.unsubscribe()
    this.resizeSubject.unsubscribe()
  }

  /** 更新 DOM 节点的引用，方便其他方法直接操作 DOM */
  private updateDOMHelper() {
    this.domHelper = new TableDOMHelper(this.artTableWrapperRef.current)
  }

  private updateRowHeightManager() {
    const virtualTop = this.domHelper.getVirtualTop()
    const virtualTopHeight = virtualTop?.clientHeight ?? 0

    let maxTrRowIndex = -1
    let maxTrBottom = -1
    let zeroHeightRowCount = 0

    for (const tr of this.domHelper.getTableRows()) {
      const rowIndex = Number(tr.dataset.rowindex)
      if (isNaN(rowIndex)) {
        continue
      }
      maxTrRowIndex = Math.max(maxTrRowIndex, rowIndex)
      const offset = tr.offsetTop + virtualTopHeight
      const size = tr.offsetHeight
      if (size === 0) {
        zeroHeightRowCount += 1
      } else {
        // 渲染出来的行高度为0，说明是display=none情况，行高不存在该种异常情况，不保存当前的高度
        this.rowHeightManager.updateRow(rowIndex, offset, size)
      }
      maxTrBottom = Math.max(maxTrBottom, offset + size)
    }

    // 当 estimatedRowHeight 过大时，可能出现「渲染行数过少，无法覆盖可视范围」的情况
    // 出现这种情况时，我们判断「下一次渲染能够渲染更多行」是否满足，满足的话就直接调用 forceUpdate
    // zeroHeightRowCount === 0 用于确保当前没有 display=none 的情况
    if (maxTrRowIndex !== -1 && zeroHeightRowCount === 0) {
      if (maxTrBottom < this.state.offsetY + this.state.maxRenderHeight) {
        const vertical = this.getVerticalRenderRange(this.lastInfo.useVirtual)
        if (vertical.bottomIndex - 1 > maxTrRowIndex) {
          this.forceUpdate()
        }
      }
    }
  }

  /** 计算表格所有列的渲染宽度之和，判断表格是否需要渲染锁列 */
  private adjustNeedRenderLock() {
    const { needRenderLock } = this.state
    const { flat, hasLockColumn } = this.lastInfo

    if (hasLockColumn) {
      const sumOfColWidth = sum(flat.full.map((col) => col.width))
      const nextNeedRenderLock = sumOfColWidth > this.domHelper.artTable.clientWidth
      if (needRenderLock !== nextNeedRenderLock) {
        this.setState({ needRenderLock: nextNeedRenderLock })
      }
    } else if (needRenderLock) {
      this.setState({ needRenderLock: false })
    }
  }
}
