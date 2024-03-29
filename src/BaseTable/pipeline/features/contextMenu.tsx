import cx from 'classnames'
import { useBaseTableContext } from 'o-rc-table/base'
import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'

import { ContextMenuStyleWrap } from '../../common-views'
import { internals } from '../../internals'
import {
  console,
  copyDataToClipboard,
  executeOnTempElement,
  getEventPath,
  getTargetEleInEventPath,
  isElementInEventPath,
} from '../../utils'
import { findByTree } from '../../utils/others'
import { TablePipeline } from '../pipeline'

interface ContextMenuItem {
  key?: string
  name: string
  action: () => void
  disabled?: boolean
  className?: string
}

interface positionForMenuParams {
  offsetX?: number
  offsetY?: number
}

export interface ContextMenuFeatureOptions {
  /** 获得自定义菜单 */
  getContextMenuItems?: (params: any) => ContextMenuItem[]
  /** 弹出框的父容器 */
  popupParent?: HTMLElement
  /** 右键菜单className */
  menuClassName?: string
}

export function contextMenu(opts: ContextMenuFeatureOptions = {}) {
  return function step(pipeline: TablePipeline) {
    const popupParent = opts.popupParent || document.body
    const { menuClassName } = opts
    const menuHelper = new MenuHelper()

    const addPopup = (menu) => {
      const ePopupDiv = document.createElement('div')
      ePopupDiv.setAttribute('class', 'o-rc-table-popup')
      popupParent.appendChild(ePopupDiv)

      let popupHidden = false
      const eventList: (keyof GlobalEventHandlersEventMap)[] = ['mousedown', 'contextmenu']

      const hidePopup: any = (event?: MouseEvent) => {
        if (isEventFromCurrentPopup(event, ePopupDiv) || popupHidden) {
          return
        }
        popupHidden = true
        popupParent.removeChild(ePopupDiv)
        eventList.forEach((eventType) => {
          window.removeEventListener(eventType, hidePopup, true)
        })
      }

      /** TODO React 17的用法, 18的用法不一样 */
      // eslint-disable-next-line react/no-deprecated
      ReactDOM.render(menu, ePopupDiv, () => {
        setTimeout(() => {
          eventList.forEach((eventType) => {
            window.addEventListener(eventType, hidePopup, true)
          })
        }, 0)
      })

      return hidePopup
    }

    const onContextMenu = (e: React.MouseEvent<HTMLTableElement, MouseEvent>) => {
      if (canShowContextMenu(e, pipeline)) {
        e.preventDefault()
        e.stopPropagation()
        showContextMenu(e)
      }
    }

    pipeline.addTableProps({ onContextMenu })

    const getContextMenuOptions = (record, column, value, event) => {
      const defaultMenuOptions = []
      if (column) {
        defaultMenuOptions.push(getCopyItem(value))
      }
      if (opts.getContextMenuItems) {
        const params = {
          record,
          column,
          value,
          event,
        }
        return opts.getContextMenuItems(params)
      }
      return defaultMenuOptions
    }

    const hideContextMenu = () => {
      menuHelper.destroy()
    }

    const getPopupParent = () => popupParent

    const showContextMenu = (e: React.MouseEvent<HTMLTableElement, MouseEvent>) => {
      const path = getEventPath(e)
      const cellEle = getCellEleInEventPath(path)
      let dataIndex
      let rowIndex
      let isInFooter
      if (cellEle) {
        dataIndex = cellEle.getAttribute('data-index')
        rowIndex = cellEle.getAttribute('data-rowindex')
        isInFooter = isElementInsideTheFooter(cellEle)
      } else {
        const rowEle = getRowEleInEventPath(path)
        rowIndex = rowEle?.getAttribute('data-rowindex')
        isInFooter = isElementInsideTheFooter(rowEle)
      }

      const dataSource = isInFooter ? pipeline.getFooterDataSource() || [] : pipeline.getDataSource()
      const record = dataSource[rowIndex]
      const column =
        dataIndex !== undefined && findByTree(pipeline.getColumns(), (item) => item.dataIndex === dataIndex)
      const value = column && record && internals.safeGetValue(column, record, rowIndex)

      const options = getContextMenuOptions(record, column, value, e)
      if (options.length === 0) {
        console.warn('context menu options is empty')
        return
      }
      const position = positionForMenu(e, popupParent)
      const menu = (
        <Menu
          options={options}
          hideContextMenu={hideContextMenu}
          position={position}
          getPopupParent={getPopupParent}
          className={menuClassName}
        />
      )
      const _hidePopup = addPopup(menu)
      menuHelper.init(_hidePopup)
    }

    return pipeline
  }
}

function getMenuItemKey({ name, index }) {
  if (name) {
    let _key = 0
    name += ''
    for (let i = 0; i < name.length; i++) {
      _key += name.charCodeAt(name[i])
    }
    return `${_key}_${index}`
  }

  return index
}

function Menu(props) {
  const {
    className,
    options = [],
    hideContextMenu,
    position,
    getPopupParent,
  }: {
    className?: string
    options: ContextMenuItem[]
    hideContextMenu: () => void
    position: { x: number; y: number }
    getPopupParent: () => HTMLElement
  } = props
  const menuRef = useRef<HTMLDivElement>()

  const tableContext = useBaseTableContext()

  useEffect(() => {
    if (menuRef.current) {
      const popupParent = getPopupParent()
      const { x, y } = position
      const { x: _x, y: _y } = keepWithinBounds(popupParent, menuRef.current, x, y)

      menuRef.current.style.left = `${_x}px`
      menuRef.current.style.top = `${_y}px`
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position])

  return (
    <ContextMenuStyleWrap
      className={cx(tableContext.Classes?.menu, className)}
      ref={menuRef}
      style={{ left: position.x, top: position.y }}
    >
      <div className={tableContext.Classes?.menuList}>
        {options.map((item, index) => (
          <MenuItem
            key={item.key ? item.key : getMenuItemKey({ name: item.name, index })}
            name={item.name}
            action={item.action}
            className={item.className}
            disabled={item.disabled}
            hideContextMenu={hideContextMenu}
          />
        ))}
      </div>
    </ContextMenuStyleWrap>
  )
}

function MenuItem(props: Record<string, any>) {
  const { name, action, className, disabled, hideContextMenu } = props

  const itemRef = useRef()
  const tableContext = useBaseTableContext()

  const handleClick = () => {
    if (disabled) {
      return
    }
    hideContextMenu()
    typeof action === 'function' && action()
  }

  const handleMouseEnter = () => {
    if (disabled) {
      return
    }
    const itemDom = itemRef.current as HTMLElement
    if (itemDom) {
      itemDom.classList.add(tableContext.Classes?.menuOptionActive)
    }
  }

  const handleMouseLeave = () => {
    if (disabled) {
      return
    }
    const itemDom = itemRef.current as HTMLElement
    if (itemDom) {
      setTimeout(() => {
        itemDom.classList.remove(tableContext.Classes?.menuOptionActive)
      }, 10)
    }
  }

  return (
    <div
      className={cx(tableContext.Classes?.menuOption, className, {
        [tableContext.Classes?.menuOptionDisable]: disabled,
      })}
      ref={itemRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className={tableContext.Classes?.menuOptionText}>{name}</span>
    </div>
  )
}

class MenuHelper {
  hidePopup: () => void

  // eslint-disable-next-line no-useless-constructor
  constructor() {}

  init = (hidePopup) => {
    this.hidePopup = hidePopup
  }

  destroy = () => {
    this.hidePopup && this.hidePopup()
    this.hidePopup = null
  }
}

/** 是否点击是外部 start */

function isEventFromCurrentPopup(event?: MouseEvent, ele?: HTMLElement) {
  if (!event || !ele) {
    return false
  }

  if (isElementInEventPath(ele, event)) {
    return true
  }

  return false
}

/** 是否点击是外部 end */

/** 计算位置 start */
function calculatePointerRelative(event: React.MouseEvent<HTMLTableElement, MouseEvent>, popupParent: HTMLElement) {
  const parentRect = popupParent.getBoundingClientRect()
  const documentRect = document.documentElement.getBoundingClientRect()

  return {
    x: event.clientX - (popupParent === document.body ? documentRect.left : parentRect.left),
    y: event.clientY - (popupParent === document.body ? documentRect.top : parentRect.top),
  }
}

function positionForMenu(
  event: React.MouseEvent<HTMLTableElement, MouseEvent>,
  popupParent: HTMLElement,
  params?: positionForMenuParams
) {
  let { x, y } = calculatePointerRelative(event, popupParent)
  if (params) {
    const { offsetX, offsetY } = params
    if (offsetX) {
      x -= offsetX
    }
    if (offsetY) {
      y -= offsetY
    }
  }
  return { x, y }
}

function keepWithinBounds(popupParent: HTMLElement, ePopup: HTMLElement, x: number, y: number) {
  const parentRect = popupParent.getBoundingClientRect()
  const docElement = document.documentElement
  const documentRect = docElement.getBoundingClientRect()
  const ePopupRect = ePopup.getBoundingClientRect()
  let parentWidth = parentRect.width
  let parentHeight = parentRect.height
  if (popupParent === document.body) {
    parentWidth = documentRect.width
    parentWidth -= Math.abs(documentRect.left - parentRect.left)
    parentHeight = documentRect.height + docElement.scrollTop
    parentHeight -= Math.abs(documentRect.top - parentRect.top)
  }
  if (x) {
    const minWidth = Math.min(ePopupRect.width, 120)
    ePopup.style.minWidth = `${minWidth}px`
    const maxX = parentWidth - minWidth
    x = Math.min(Math.max(x, 0), Math.abs(maxX)) // 目前位置，最大支持的位置
  }

  if (y) {
    const minHeight = Math.min(ePopupRect.height, 180)
    const maxY = parentHeight - minHeight
    y = Math.min(Math.max(y, 0), Math.abs(maxY)) // 目前位置，最大支持的位置
  }

  return { x, y }
}

/** 计算位置 end */

/** 获得点击的元素 start */

function getCellEleInEventPath(path: Array<HTMLElement>) {
  return getTargetEleInEventPath(path, (ele) => ele && ele.getAttribute('data-role') === 'table-cell')
}

function getRowEleInEventPath(path: Array<HTMLElement>) {
  return getTargetEleInEventPath(path, (ele) => ele && ele.getAttribute('data-role') === 'table-row')
}

/** 获得点击的元素 end */

function isElementInsideTheFooter(ele: HTMLElement): boolean {
  let pointer = ele
  while (pointer) {
    if (pointer.tagName === 'TFOOT') {
      return true
    }
    if (pointer.tagName === 'TABLE' || pointer.tagName === 'TBODY') {
      return false
    }
    pointer = pointer.parentElement
  }
  return false
}

function canShowContextMenu(e: React.MouseEvent<HTMLTableElement, MouseEvent>, pipeline: TablePipeline) {
  return (
    pipeline.ref.current.domHelper?.tableBody.contains(e.target) ||
    pipeline.ref.current.domHelper?.tableFooter.contains(e.target)
  )
}

// 默认选项
function getCopyItem(v) {
  return {
    name: '复制',
    action: () => {
      executeOnTempElement(copyDataToClipboard(v))
    },
  }
}
