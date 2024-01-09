import { defineConfig } from 'father'
import fatherConfig from '@ocloud/admin-father-config'
import { resolve } from 'path'

export default defineConfig({
  ...fatherConfig,
  alias: {
    '@src': resolve(__dirname, './src'),
  },
})
