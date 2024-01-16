import type { CSSObject } from '@ant-design/cssinjs'

import type { GenerateStyle } from '../../theme/internal'
import type { TableToken } from './index'

const genFixedStyle: GenerateStyle<TableToken, CSSObject> = (token) => {
  const { componentCls, colorSplit, zIndexTableFixed } = token

  return {
    [`${componentCls}-wrapper`]: {
      [`${componentCls}-fixed-shadow-mask`]: {
        zIndex: zIndexTableFixed,
        [`> div${componentCls}-fixed-shadow.show-shadow`]: {
          boxShadow: `${colorSplit} 0 0 8px 8px`,
          borderRight: `1px solid ${colorSplit}`,
        },
      },
    },
  }
}

export default genFixedStyle
