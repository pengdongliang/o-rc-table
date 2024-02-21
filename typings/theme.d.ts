import { Theme as EmotionTheme } from '@emotion/react'
import type { ThemeConfig } from 'antd'

export type BreakPointType = {
  /** 1920 */
  xxxl?: number
  /** 1600 */
  xxl?: number
  /** 1440 */
  xl?: number
  /** 1200 */
  lg?: number
  /** 1024 */
  l?: number
  /** 992 */
  m?: number
  /** 768 */
  sm?: number
  /** 640 */
  s?: number
  /** 480 */
  xs?: number
  /** 320 */
  xxs?: number
}

interface ThemeConfigType<ThemeConfig = Record<string, any>> {
  antdTheme: ThemeConfig
  namespace: string
  breakPoint: BreakPointType
  colors: {
    white: string
    black: string
    primary: string
  }
  [K: string]: any
}

declare module '@emotion/react' {
  export interface Theme extends ThemeConfigType<ThemeConfig>, EmotionTheme {}
}
