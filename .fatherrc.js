import { defineConfig } from 'father'
import { resolve } from 'path'

export default defineConfig({
  sourcemap: false,
  cjs: {
    output: 'dist/cjs',
    ignores: ['src/**/demo/**', 'src/**/__test__/**']
  },
  esm: {
    output: 'dist/es',
    ignores: ['src/**/demo/**', 'src/**/__test__/**']
  },
  alias: {
    '@src': resolve(__dirname, './src'),
  }
})
