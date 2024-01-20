import { Theme as EmotionTheme } from '@emotion/react'
import { BaseThemeProps } from '@ocloud/admin-context'

declare module '@emotion/react' {
  export interface Theme extends BaseThemeProps, EmotionTheme {}
}
