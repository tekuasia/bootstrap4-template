const path = require('path')

const isProduction = process.env.WEBPACK_MODE === 'production'
const isDevelopment = !isProduction
const shouldUseSourceMap = isDevelopment
const shouldMinify = isProduction
const shouldPreload = false
const shouldPrefixCss = isProduction
const shouldHashName = isDevelopment

// paths
const rootDir = path.resolve(__dirname, '..')
const srcDir = path.join(rootDir, 'src')
const buildDir = path.join(rootDir, 'dist')

module.exports = {
  isProduction,
  isDevelopment,
  shouldUseSourceMap,
  shouldMinify,
  shouldPreload,
  shouldPrefixCss,
  shouldHashName,
  rootDir,
  srcDir,
  buildDir
}
