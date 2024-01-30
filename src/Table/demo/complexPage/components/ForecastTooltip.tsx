import { Tooltip } from '@ocloud/antd'
import React, { useState } from 'react'

export const getElementScreenPosition = (element: any) => {
  let left = element.offsetLeft
  let top = element.offsetTop

  let currentElement = element.offsetParent
  while (currentElement) {
    left += currentElement.offsetLeft
    top += currentElement.offsetTop
    currentElement = currentElement.offsetParent
  }

  return { left, top }
}

export interface ForecastTooltipRef {
  handleMouseEnter: (content: any, e: React.MouseEvent<HTMLElement>) => void
  handleMouseLeave: () => void
}

export const ForecastTooltip = React.forwardRef<ForecastTooltipRef>((_props, ref) => {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [tooltipContent, setTooltipContent] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [tooltipContainer, setTooltipContainer] = useState(null)

  const handleMouseEnter = (content: any, e: React.MouseEvent<HTMLElement>) => {
    const { top, left } = getElementScreenPosition(e.target)
    setTooltipVisible(true)
    setTooltipContent(content)
    setTooltipPosition({ top, left })
    setTooltipContainer((e.target as any).parentNode)
  }

  const handleMouseLeave = () => {
    setTooltipVisible(false)
    setTooltipContent(null)
    setTooltipPosition({ top: 0, left: 0 })
    setTooltipContainer(null)
  }

  React.useImperativeHandle(ref, () => ({
    handleMouseEnter,
    handleMouseLeave,
  }))

  return (
    <>
      {tooltipVisible && (
        <Tooltip
          title={tooltipContent}
          placement="leftBottom"
          open={tooltipVisible}
          getPopupContainer={() => tooltipContainer}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        />
      )}
    </>
  )
})
