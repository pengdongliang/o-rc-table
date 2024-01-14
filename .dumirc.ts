import { defineConfig } from 'dumi'
import { resolve } from 'path'
import { version } from './package.json'

export default defineConfig({
  outputPath: 'docs-dist',
  themeConfig: {
    name: 'o-rc-table',
  },
  resolve: {
    atomDirs: [{ type: 'component', dir: 'src' }],
  },
  alias: {
    'o-rc-table': resolve(__dirname, 'src/BaseTable'),
    '@table': resolve(__dirname, 'src/Table'),
    'baseTableDemo': resolve(__dirname, 'src/BaseTable/demo'),
    'tableDemo': resolve(__dirname, 'src/Table/demo'),
    '@src': resolve(__dirname, 'src'),
  },
  conventionRoutes: {
    // to avoid generate routes for .dumi/pages/index/components/xx
    exclude: [new RegExp('index/components/')],
  },
  ssr: process.env.NODE_ENV === 'production' ? {} : false,
  hash: true,
  mfsu: false,
  crossorigin: {},
  favicons: ['https://gw.alipayobjects.com/zos/rmsportal/rlpTLlbMzTNYuZGGCVYM.png'],
  locales: [
    { id: 'zh-CN', name: '中文', suffix: '' },
    { id: 'en-US', name: 'English', suffix: '-en' },
  ],
  define: {
    antdReproduceVersion: version,
  },
  metas: [{ name: 'theme-color', content: '#1677ff' }],
})
