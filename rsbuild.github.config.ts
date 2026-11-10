import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginSass } from '@rsbuild/plugin-sass'

export default defineConfig({
  plugins: [pluginReact(), pluginSass()],
  html: {
    title: 'History of philosophy',
    favicon: './public/favicon.ico',
  },
  output: {
    target: 'web',
    // Keep BASE_URL + asset URLs under the GitHub Pages project path.
    assetPrefix: '/history_of_philosophy/',
    cleanDistPath: true,
    distPath: {
      root: './docs',
    },
  },
  server: {
    base: '/history_of_philosophy',
  },
})
