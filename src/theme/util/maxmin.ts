import { unit } from '@ant-design/cssinjs'

import type { CSSUtil } from './genComponentStyleHook'

export default function genMaxMin(type: 'css' | 'js'): Partial<CSSUtil> {
  if (type === 'js') {
    return {
      max: Math.max as CSSUtil['max'],
      min: Math.min as CSSUtil['min'],
    }
  }
  return {
    max: (...args: (string | number)[]) => `max(${args.map((value) => unit(value)).join(',')})`,
    min: (...args: (string | number)[]) => `min(${args.map((value) => unit(value)).join(',')})`,
  }
}
