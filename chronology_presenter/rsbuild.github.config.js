export default {
  plugins: [
    // configure Rsbuild plugins
  ],
  dev: {
    // options for local development
  },
  html: {
    title: 'History of philosophy',
  },
  tools: {
    // options for the low-level tools
  },
  output: {
    distPath: {
        root: '../docs'
    },
    assetPrefix: '/history_of_philosophy/'
  },
  source: {
    // options for source code parsing and compilation
  },
  server: {
    // options for the Rsbuild Server,
    // will take effect during local development and preview
  },
  security: {
    // options for Web security
  },
  performance: {
    // options for build performance and runtime performance
  },
  moduleFederation: {
    // options for module federation
  },
};