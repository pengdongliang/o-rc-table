import { useStyleRegister } from '@ant-design/cssinjs'
import useToken from '@src/theme/useToken'

import type { CSPConfig } from '../../ConfigProvider'
import { resetIcon } from '../style'

const useResetIconStyle = (iconPrefixCls: string, csp?: CSPConfig) => {
  const [theme, token] = useToken()

  // Generate style for icons
  return useStyleRegister(
    {
      theme,
      token,
      hashId: '',
      path: ['ant-design-icons', iconPrefixCls],
      nonce: () => csp?.nonce,
    },
    () => [
      {
        [`.${iconPrefixCls}`]: {
          ...resetIcon(),
          [`.${iconPrefixCls} .${iconPrefixCls}-icon`]: {
            display: 'block',
          },
        },
      },
    ]
  )
}

export default useResetIconStyle
