// export default {
//   html: {
//     title: 'History of philosophy',
//   },
//   output: {
//     // distPath: {
//     //     root: '../docs'
//     // },
//     assetPrefix: '/history_of_philosophy/',
//     // cleanDistPath: '../docs'
//   }
// };


import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  html: {
    title: 'History of philosophy',
  },
  plugins: [pluginReact()],
  output: {
    assetPrefix: '/history_of_philosophy/',
    cleanDistPath: true,
    distPath: {
      root: '../docs'
    }
  }
});
