import React from 'react'
import ResizeObserver from 'resize-observer-polyfill'

// eslint-disable-next-line @typescript-eslint/ban-types
const useResizeObserver = (callbck: Function, [element]: Array<HTMLElement>) => {
  React.useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      callbck()
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])
}

export default useResizeObserver
