import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';

export default defineConfig({
  plugins: [pluginReact(), pluginSass()],
  html: {
    title: 'History of philosophy',
  },
  output: {
    assetPrefix: '/history_of_philosophy/',
    cleanDistPath: true,
    distPath: {
      root: '../docs',
    },
  },
});
