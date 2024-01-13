function isOutput() {
  return true
}

function log(...msg) {
  if (isOutput()) {
    // eslint-disable-next-line no-console
    console.log('[o-rc-table]', ...msg)
  }
}

function warn(...msg) {
  if (isOutput()) {
    // eslint-disable-next-line no-console
    console.warn('[o-rc-table]', ...msg)
  }
}

function error(...msg) {
  console.error('[o-rc-table]', ...msg)
}

function table(...msg) {
  if (isOutput()) {
    // eslint-disable-next-line no-console
    console.table('[o-rc-table]', ...msg)
  }
}

export default {
  log,
  warn,
  error,
  table,
}
