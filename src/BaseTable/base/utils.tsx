import cssVars from 'css-vars-ponyfill'
import type { CellEllipsisType, ColumnType } from 'o-rc-table'
import React from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import { asyncScheduler, BehaviorSubject, defer, fromEvent, Subscription } from 'rxjs'
import { map, throttleTime } from 'rxjs/operators'

import { browserType } from '../utils'
import { hasScroll } from '../utils/element'
import mergeCellProps from '../utils/mergeCellProps'
import { TableDOMHelper } from './helpers/TableDOMUtils'
import { defaultCSSVariables } from './styles'

export const STYLED_REF_PROP = 'ref'

export const OVERSCAN_SIZE = 100

export function sum(arr: number[]) {
  let result = 0
  arr.forEach((x) => {
    result += x
  })
  return result
}

// 使用 defer 避免过早引用 window，导致在 SSR 场景下报错
export const throttledWindowResize$ = defer(() =>
  fromEvent(window, 'resize', { passive: true }).pipe(
    throttleTime(150, asyncScheduler, { leading: true, trailing: true })
  )
)

interface ContentRectType {
  hide: boolean
  bottom: number
  height: number
  left: number
  right: number
  top: number
  width: number
  x: number
  y: number
}

export const addResizeObserver = (element: HTMLElement | null, handler?: (react: ContentRectType) => void) => {
  const measure = (entries: any[]) => {
    if (!entries[0] || !entries[0].contentRect) {
      return
    }
    const { contentRect } = entries[0]
    const hide = contentRect.width === 0 && contentRect.height === 0 // 隐藏条件：高宽都为0
    const rect: ContentRectType = { hide, ...contentRect }
    handler && handler(rect)
  }
  const resizeObserver = new ResizeObserver(measure)
  resizeObserver && resizeObserver.observe(element)
  return resizeObserver
}

/** 获取默认的滚动条大小 */
function getScrollbarSizeImpl() {
  const scrollDiv = document.createElement('div')

  scrollDiv.style.position = 'absolute'
  scrollDiv.style.width = '100px'
  scrollDiv.style.height = '100px'
  scrollDiv.style.overflow = 'scroll'
  scrollDiv.style.top = '-9999px'

  document.body.appendChild(scrollDiv)
  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
  const scrollbarHeight = scrollDiv.offsetHeight - scrollDiv.clientHeight
  document.body.removeChild(scrollDiv)

  return { width: scrollbarWidth, height: scrollbarHeight }
}

let scrollBarSize$: BehaviorSubject<{ width: number; height: number }>

export function getScrollbarSize() {
  if (scrollBarSize$ == null) {
    scrollBarSize$ = new BehaviorSubject(getScrollbarSizeImpl())
    throttledWindowResize$.pipe(map(() => getScrollbarSizeImpl())).subscribe(scrollBarSize$)
  }

  return scrollBarSize$.value
}

/** 同步多个元素之间的 scrollLeft, 每当 scrollLeft 发生变化时 callback 会被调用 */
export function syncScrollLeft(elements: HTMLElement[], callback: (scrollLeft: number) => void): Subscription {
  const bypassSet: Set<HTMLElement> = new Set()

  function publishScrollLeft(origin: HTMLElement, scrollLeft: number) {
    bypassSet.clear()
    for (const elem of elements) {
      if (elem) {
        if (elem === origin) {
          continue
        }
        elem.scrollLeft = scrollLeft
        bypassSet.add(elem)
      }
    }
  }

  const subscription = new Subscription()

  for (const ele of elements) {
    if (ele) {
      const listener = () => {
        if (bypassSet.has(ele)) {
          bypassSet.delete(ele)
          return
        }
        const { scrollLeft } = ele
        // 某一元素当滚动条消失时会触发scroll事件（scrolLeft重置为0），不同步其他其他元素的scrollLeft
        if (scrollLeft === 0 && !hasScroll(ele)) {
          return
        }
        publishScrollLeft(ele, scrollLeft)
        callback(scrollLeft)
      }
      ele.addEventListener('scroll', listener, { passive: true })
      subscription.add(() => ele.removeEventListener('scroll', listener))
    }
  }

  return subscription
}

/**
 * Performs equality by iterating through keys on an object and returning false
 * when any key has values which are not strictly equal between the arguments.
 * Returns true when the values of all keys are strictly equal.
 */
export function shallowEqual<T>(objA: T, objB: T): boolean {
  const { hasOwnProperty } = Object.prototype

  if (Object.is(objA, objB)) {
    return true
  }

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false
  }

  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) {
    return false
  }

  // Test for A's keys different from B.
  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwnProperty.call(objB, keysA[i]) || !Object.is((objA as any)[keysA[i]], (objB as any)[keysA[i]])) {
      return false
    }
  }

  return true
}

// todo: 抽出mergeRowProps
export function composeRowPropsGetter(
  onRow: (record: any, rowIndex: number) => React.HTMLAttributes<HTMLTableRowElement>,
  pendingRowProps?: React.HTMLAttributes<HTMLTableRowElement>
): (record: any, rowIndex: number) => React.HTMLAttributes<HTMLTableRowElement> {
  const keys = Object.keys(pendingRowProps)
  if (keys.length) {
    return ((row: any, rowIndex: number) => {
      return mergeCellProps(onRow(row, rowIndex) as any, pendingRowProps as any)
    }) as any
  }
  return onRow
}

export function getTableScrollHeaderDOM(domHelper: TableDOMHelper): HTMLDivElement {
  return browserType.isIE ? domHelper.tableHeaderMain : domHelper.tableHeader
}

export function getTableScrollFooterDOM(domHelper: TableDOMHelper): HTMLDivElement {
  return browserType.isIE ? domHelper.tableFooterMain : domHelper.tableFooter
}

export const cssPolifill = ({
  variables,
  enableCSSVariables,
  bordered,
}: {
  variables: { [key: string]: any }
  enableCSSVariables?: boolean
  bordered?: boolean
}) => {
  if (enableCSSVariables === false) {
    return
  }

  const conditionCSSVariables = {}

  // 默认情况下存在td、th无左右边框，开启`bordered`属性后才开启，否则隐藏这两种属性
  if (!bordered) {
    conditionCSSVariables['--cell-border-horizontal'] = 'none'
    conditionCSSVariables['--header-cell-border-horizontal'] = 'none'
  }

  cssVars({
    // exclude: 'link[href*="semantic-ui"]',
    // onlyLegacy: false,
    // rootElement: rootElement,
    include: 'style[data-styled]',
    variables: { ...defaultCSSVariables, ...variables, ...conditionCSSVariables },
    watch: true,
    silent: true,
  })
}

export const getTitleFromCellRenderChildren = ({
  ellipsis,
  rowType,
  children,
}: Pick<ColumnType, 'ellipsis'> & { rowType: 'header' | 'body' | 'footer'; children: React.ReactNode }) => {
  let title: string
  const ellipsisConfig: CellEllipsisType = ellipsis === true ? { showTitle: true } : ellipsis
  if (ellipsisConfig && (ellipsisConfig.showTitle || rowType === 'header')) {
    if (typeof children === 'string' || typeof children === 'number') {
      title = children.toString()
    } else if (React.isValidElement(children) && typeof children.props.children === 'string') {
      title = children.props.children
    }
  }
  return title
}
