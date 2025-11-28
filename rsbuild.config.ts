import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginSass } from '@rsbuild/plugin-sass'

export default defineConfig({
  plugins: [pluginReact(), pluginSass()],
  server: {
    base: '/history_of_philosophy',
  },
  html: {
    title: 'History of philosophy',
    favicon: './public/favicon.ico',
  },
})
