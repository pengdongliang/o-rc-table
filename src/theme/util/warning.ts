/* eslint-disable */
let warned = {}
const preWarningFns = []

/**
 * Pre warning enable you to parse content before console.error.
 * Modify to null will prevent warning.
 */
export var preMessage = function preMessage(fn: any) {
  preWarningFns.push(fn)
}
export function warning(valid: boolean, message: string) {
  // Support uglify
  if (process.env.NODE_ENV !== 'production' && !valid && console !== undefined) {
    const finalMessage = preWarningFns.reduce(function (msg, preMessageFn) {
      return preMessageFn(msg !== null && msg !== void 0 ? msg : '', 'warning')
    }, message)
    if (finalMessage) {
      console.error('Warning: '.concat(finalMessage))
    }
  }
}
export function note(valid: any, message: any) {
  if (process.env.NODE_ENV !== 'production' && !valid && console !== undefined) {
    const finalMessage = preWarningFns.reduce(function (msg, preMessageFn) {
      return preMessageFn(msg !== null && msg !== void 0 ? msg : '', 'note')
    }, message)
    if (finalMessage) {
      console.warn('Note: '.concat(finalMessage))
    }
  }
}
export function resetWarned() {
  warned = {}
}
export function call(method: { (valid: boolean, message: string): void; (valid: any, message: any): void; (arg0: boolean, arg1: any): void }, valid: any, message: string | number) {
  if (!valid && !warned[message]) {
    method(false, message)
    warned[message] = true
  }
}
export function warningOnce(valid: any, message: string | number) {
  call(warning, valid, message)
}
export function noteOnce(valid: any, message: string | number) {
  call(note, valid, message)
}
warningOnce.preMessage = preMessage
warningOnce.resetWarned = resetWarned
warningOnce.noteOnce = noteOnce
export default warningOnce
/* eslint-enable */
