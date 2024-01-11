import { useStyleRegister } from '@ant-design/cssinjs'

import type {
  AliasToken,
  GenerateStyle,
  PresetColorKey,
  PresetColorType,
  SeedToken,
  UseComponentStyleResult,
} from './interface'
import { PresetColors } from './interface'
import useToken from './useToken'
import calc from './util/calc'
import type { FullToken, GetDefaultToken } from './util/genComponentStyleHook'
import genComponentStyleHook, { genStyleHooks, genSubStyleComponent } from './util/genComponentStyleHook'
import genPresetColor from './util/genPresetColor'
import statisticToken, { merge as mergeToken } from './util/statistic'
import useResetIconStyle from './util/useResetIconStyle'

export { defaultConfig, DesignTokenContext } from './context'
export {
  calc,
  genComponentStyleHook,
  genPresetColor,
  genStyleHooks,
  genSubStyleComponent,
  mergeToken,
  PresetColors,
  statisticToken,
  // hooks
  useResetIconStyle,
  useStyleRegister,
  useToken,
}
export type {
  AliasToken,
  // FIXME: Remove this type
  AliasToken as DerivativeToken,
  FullToken,
  GenerateStyle,
  GetDefaultToken,
  PresetColorKey,
  PresetColorType,
  SeedToken,
  UseComponentStyleResult,
}
