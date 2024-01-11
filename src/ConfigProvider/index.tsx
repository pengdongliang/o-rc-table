import type { AliasToken, MappingAlgorithm, OverrideToken } from '../theme/interface'

type ComponentsConfig = {
  [key in keyof OverrideToken]?: OverrideToken[key] & {
    algorithm?: boolean | MappingAlgorithm | MappingAlgorithm[]
  }
}

export interface ThemeConfig {
  token?: Partial<AliasToken>
  components?: ComponentsConfig
  algorithm?: MappingAlgorithm | MappingAlgorithm[]
  hashed?: boolean
  inherit?: boolean
  cssVar?:
    | {
        /**
         * Prefix for css variable, default to `antd`.
         */
        prefix?: string
        /**
         * Unique key for theme, should be set manually < react@18.
         */
        key?: string
      }
    | boolean
}

export * from './context'
