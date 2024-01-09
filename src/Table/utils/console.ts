function isOutput() {
  return true
}

function log(...msg) {
  if (isOutput()) {
    // eslint-disable-next-line no-console
    console.log('[ocloud-table]', ...msg)
  }
}

function warn(...msg) {
  if (isOutput()) {
    // eslint-disable-next-line no-console
    console.warn('[ocloud-table]', ...msg)
  }
}

function error(...msg) {
  console.error('[ocloud-table]', ...msg)
}

function table(...msg) {
  if (isOutput()) {
    // eslint-disable-next-line no-console
    console.table('[ocloud-table]', ...msg)
  }
}

export default {
  log,
  warn,
  error,
  table,
}
