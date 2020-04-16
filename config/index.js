const path = require('path')

const isProduction = process.env.WEBPACK_MODE === 'production'
const isDevelopment = !isProduction
const shouldUseSourceMap = isDevelopment
const shouldMinify = true
const shouldPreload = false
const shouldPreloadFonts = false
const shouldPrefixCss = isProduction
const shouldHashName = isDevelopment
const shouldGenerateManifest = false
const shouldOpenWebpage = false
const shouldPurgeCss = isProduction

const copies = [
  // files to be copied
  // {
  //   from: 'local path',
  //   to: 'subfolder of build'
  // }
]

const excludedAssets = isProduction
  ? [/\.js$/]
  : [/runtime\.js$/]

// paths
const rootDir = path.resolve(__dirname, '..')
const srcDir = path.join(rootDir, 'src')
const buildDir = path.join(rootDir, 'build')
const scriptDir = path.join(srcDir, 'scripts')
const entry = {
  index: path.join(scriptDir, 'index.js')
}

if (shouldMinify) {
  entry['index.min'] = path.join(scriptDir, 'index.js')
}

module.exports = {
  isProduction,
  isDevelopment,
  shouldUseSourceMap,
  shouldMinify,
  shouldPreload,
  shouldPreloadFonts,
  shouldPrefixCss,
  shouldHashName,
  shouldGenerateManifest,
  shouldOpenWebpage,
  shouldPurgeCss,
  excludedAssets,
  copies,
  entry,
  rootDir,
  srcDir,
  buildDir
}
