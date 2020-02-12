const path = require('path')

const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = !isProduction
const rootDir = path.resolve(__dirname, '..')
const srcDir = path.join(rootDir, 'src')
const shouldUseSourceMap = isDevelopment

module.exports = {
  isProduction,
  isDevelopment,
  rootDir,
  srcDir,
  shouldUseSourceMap
}
