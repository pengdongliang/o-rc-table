import { defineConfig } from 'dumi'
import { resolve } from 'path'

export default defineConfig({
  outputPath: 'docs-dist',
  themeConfig: {
    name: 'o-rc-table',
  },
  resolve: {
    atomDirs: [{ type: 'component', dir: 'src' }],
  },
  alias: {
    'o-rc-table': resolve(__dirname, 'src'),
    'demo': resolve(__dirname, 'src/demo'),
  },
  locales: [
    { id: 'zh-CN', name: '中文' },
    { id: 'en-US', name: 'EN' },
  ],
})
