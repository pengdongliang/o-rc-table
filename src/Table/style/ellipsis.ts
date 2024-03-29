import type { CSSObject } from '@ant-design/cssinjs'

import type { GenerateStyle } from '../../theme/internal'
import { textEllipsis } from '../../theme/style'
import type { TableToken } from './index'

const genEllipsisStyle: GenerateStyle<TableToken, CSSObject> = (token) => {
  const { componentCls } = token
  return {
    [`${componentCls}-wrapper`]: {
      [`${componentCls}-cell-ellipsis`]: {
        ...textEllipsis,
        wordBreak: 'keep-all',

        [`&${componentCls}-header-cell-content`]: {
          display: 'block',
        },

        // Fixed first or last should special process
        [`
          &${componentCls}-cell-fix-left-last,
          &${componentCls}-cell-fix-right-first
        `]: {
          overflow: 'visible',
          [`${componentCls}-cell-content`]: {
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
        },

        [`${componentCls}-column-title`]: {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          wordBreak: 'keep-all',
        },
      },
    },
  }
}

export default genEllipsisStyle
