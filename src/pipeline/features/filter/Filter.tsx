import cx from 'classnames'
import React, { CSSProperties, ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

import { Classes } from '../../../base/styles'
import { addResizeObserver } from '../../../base/utils'
import { CustomeFilterPanelProps, DefaultFilterPanelProps, FilterPanel as FilterPanelType } from '../../../interfaces'
import { calculatePopupRelative } from '../../../utils'
import KeyCode from '../../../utils/keyCode'
import DefaultFilterContent from './DefaultFilterContent'
import DefaultFilterIcon from './DefaultFilterIcon'
import FilterPanel from './FilterPanel'

const HEADER_ICON_OFFSET_Y = 8 + 1 // padding-top + border
const HEADER_ICON_OFFSET_X = 16 + 1 // padding-left+ border

interface FilterProps {
  style?: CSSProperties
  className?: string
  size?: number
  isFilterActive: boolean
  FilterPanelContent?: FilterPanelType
  filterIcon?: ReactNode | ((filtered: boolean) => ReactNode)
  setFilterModel: DefaultFilterPanelProps['setFilterModel']
  filterModel: DefaultFilterPanelProps['filterModel']
  setFilter: CustomeFilterPanelProps['setFilter']
  stopClickEventPropagation?: boolean
  stopESCKeyDownEventPropagation?: boolean
  hideFilterPopupHeader?: boolean
  getPopupParent?: (triggerElement: HTMLElement) => HTMLElement
  localeText?: { [key: string]: string }
}

interface FilterPanelProps {
  ele: HTMLElement
  filterIcon: ReactNode
  hidePanel: () => void
  renderPanelContent: () => JSX.Element
  hideFilterPopupHeader?: boolean
  popupParent?: HTMLElement
}

const FilterIconSpanStyle = styled.span`
  // position: absolute;
  // right: 4px;
  // cursor: pointer;
  // transform: translateY(-50%);
  // top: 50%;
  // height: 12px;
  > .${Classes.filterIcon} {
    display: flex;
  }
`

function Panel({
  ele,
  filterIcon,
  hidePanel,
  renderPanelContent,
  hideFilterPopupHeader,
  popupParent,
}: FilterPanelProps) {
  const filterPanelRef = React.useRef(null)
  const [position, setPosition] = React.useState(
    calculatePopupRelative(ele, popupParent, _getPanelOffset(ele, hideFilterPopupHeader))
  )
  const style = {
    position: 'absolute',
    zIndex: 1050,
  }

  const handleFilterPanelResize = () => {
    setPosition(calculatePopupRelative(ele, popupParent, _getPanelOffset(ele, hideFilterPopupHeader)))
  }

  useEffect(() => {
    const resizeObserver = addResizeObserver(filterPanelRef.current.children[0], handleFilterPanelResize)
    return () => {
      resizeObserver && resizeObserver.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={filterPanelRef}>
      <FilterPanel
        style={style}
        onClose={hidePanel}
        position={position}
        filterIcon={filterIcon}
        hideFilterPopupHeader={hideFilterPopupHeader}
      >
        {renderPanelContent()}
      </FilterPanel>
    </div>
  )
}

function Filter({
  size = 12,
  style,
  className,
  FilterPanelContent,
  filterIcon,
  setFilter,
  setFilterModel,
  filterModel,
  isFilterActive,
  stopClickEventPropagation,
  stopESCKeyDownEventPropagation,
  hideFilterPopupHeader,
  getPopupParent,
  localeText,
}: FilterProps) {
  const [showPanel, setShowPanel] = React.useState(false)
  const iconRef = React.useRef(null)
  const iconWrapRef = React.useRef<HTMLElement>()

  const hidePanel = () => setShowPanel(false)

  const renderPanelContent = () => {
    if (FilterPanelContent) {
      return (
        <FilterPanelContent
          setFilter={setFilter}
          filterModel={filterModel}
          isFilterActive={isFilterActive}
          hidePanel={hidePanel}
        />
      )
    }
    return (
      <DefaultFilterContent
        setFilterModel={setFilterModel}
        filterModel={filterModel}
        isFilterActive={isFilterActive}
        hidePanel={hidePanel}
        localeText={localeText}
      />
    )
  }

  const handleIconClick = (e: {
    currentTarget: { contains: (arg0: HTMLElement) => any }
    target: HTMLElement
    stopPropagation: () => void
  }) => {
    // 只有当icon区域点击会触发面板展开
    // 防止 createPortal 区域的点击触发该事件
    if (e.currentTarget.contains(e.target as HTMLElement)) {
      setShowPanel(true)
    }
    if (stopClickEventPropagation) {
      e.stopPropagation()
    }
  }
  const handleKeyDown = (e: {
    keyCode: number
    currentTarget: { contains: (arg0: HTMLElement) => any }
    target: HTMLElement
    stopPropagation: () => void
  }) => {
    if (e.keyCode === KeyCode.ESC) {
      if (e.currentTarget.contains(e.target as HTMLElement)) {
        setShowPanel(false)
      }
      if (stopESCKeyDownEventPropagation) {
        e.stopPropagation()
      }
    }
  }
  const iconClassName = cx({
    [className]: true,
    'filter-panel-open': showPanel,
  })

  const displayFilterIcon: ReactNode = typeof filterIcon === 'function' ? filterIcon(isFilterActive) : filterIcon
  const popupParent: HTMLElement = getPopupParent?.(iconWrapRef.current) || document.body
  return (
    <FilterIconSpanStyle
      style={style}
      className={iconClassName}
      onClick={handleIconClick}
      onKeyDown={handleKeyDown}
      ref={iconWrapRef}
      tabIndex={-1}
    >
      <span ref={iconRef} className={Classes.filterIcon}>
        {displayFilterIcon || <DefaultFilterIcon width={size} height={size} />}
      </span>
      {showPanel &&
        createPortal(
          <Panel
            ele={hideFilterPopupHeader ? iconWrapRef.current : iconRef.current}
            filterIcon={displayFilterIcon}
            hidePanel={hidePanel}
            renderPanelContent={renderPanelContent}
            hideFilterPopupHeader={hideFilterPopupHeader}
            popupParent={popupParent}
          />,
          popupParent
        )}
    </FilterIconSpanStyle>
  )
}

function _getPanelOffset(
  ele: HTMLElement,
  hideFilterPopupHeader?: boolean
): {
  x: number
  y: number
} {
  if (hideFilterPopupHeader) {
    return { x: 0, y: 0 - ele.offsetHeight }
  }
  return { x: HEADER_ICON_OFFSET_X, y: HEADER_ICON_OFFSET_Y }
}

export default Filter
