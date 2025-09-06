import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
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
