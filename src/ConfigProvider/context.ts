import React from 'react'

export interface CSPConfig {
  nonce?: string
}

export interface ConfigConsumerProps {
  iconPrefixCls: string
  getPrefixCls: (suffixCls?: string, customizePrefixCls?: string) => string
  csp?: CSPConfig
}

export const defaultIconPrefixCls = 'oicon'

const defaultGetPrefixCls = (suffixCls?: string, customizePrefixCls?: string) => {
  if (customizePrefixCls) {
    return customizePrefixCls
  }
  return suffixCls ? `ocloud-${suffixCls}` : 'ocloud'
}

export const ConfigContext = React.createContext<ConfigConsumerProps>({
  getPrefixCls: defaultGetPrefixCls,
  iconPrefixCls: defaultIconPrefixCls,
})

export const { Consumer: ConfigConsumer } = ConfigContext
