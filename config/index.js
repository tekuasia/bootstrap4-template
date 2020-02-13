const path = require('path')

const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = !isProduction
const shouldUseSourceMap = isDevelopment
const shouldMinify = isProduction
const shouldPreload = false
const shouldPrefixCss = isProduction

// paths
const rootDir = path.resolve(__dirname, '..')
const srcDir = path.join(rootDir, 'src')
const buildDir = path.join(rootDir, 'build')

module.exports = {
  isProduction,
  isDevelopment,
  shouldUseSourceMap,
  shouldMinify,
  shouldPreload,
  shouldPrefixCss,
  rootDir,
  srcDir,
  buildDir
}
