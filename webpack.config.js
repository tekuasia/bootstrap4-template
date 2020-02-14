const path = require('path')
const webpack = require('webpack')
const HtmlWebPackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const PreloadWebpackPlugin = require('preload-webpack-plugin')
const CssUrlRelativePlugin = require('css-url-relative-plugin')
const ManifestPlugin = require('webpack-manifest-plugin')
const glob = require('glob')

const configWebpack = (_, argv) => {
  if (argv && argv.mode === 'production') {
    process.env.WEBPACK_MODE = 'production'
  }

  const {
    isProduction,
    isDevelopment,
    // feature flags
    shouldUseSourceMap,
    shouldMinify,
    shouldPreload,
    shouldHashName,
    // paths
    rootDir,
    srcDir,
    buildDir,
    entry
  } = require('./config')
  const getStyleLoaders = require('./config/getStyleLoaders')

  const config = {
    context: rootDir,
    mode: isDevelopment ? 'development' : 'production',
    devtool: shouldUseSourceMap ? (isDevelopment ? 'inline-source-map' : 'source-map') : false,
    entry,
    output: {
      filename: shouldHashName ? 'scripts/[name].[contenthash:8].js' : 'scripts/[name].js',
      path: buildDir
    },
    module: {
      rules: [
        {
          test: /\.(js|mjs)$/,
          exclude: /@babel(?:\/|\\{1,2})runtime/,
          loader: require.resolve('babel-loader'),
          options: {
            babelrc: false,
            configFile: false,
            compact: false,
            cacheDirectory: true,
            // See #6846 for context on why cacheCompression is disabled
            cacheCompression: false,

            // Babel sourcemaps are needed for debugging into node_modules
            // code.  Without the options below, debuggers like VSCode
            // show incorrect code and set breakpoints on the wrong lines.
            sourceMaps: shouldUseSourceMap,
            inputSourceMap: shouldUseSourceMap
          }
        },
        {
          test: /\.scss$/,
          use: getStyleLoaders(
            {
              importLoaders: 3,
              sourceMap: shouldUseSourceMap
            },
            'sass-loader'
          )
        },
        {
          test: /\.(gif|png|jpe?g|svg)$/i,
          use: [
            {
              loader: require.resolve('url-loader'),
              options: {
                limit: 8192,
                name: '[name].[ext]',
                fallback: 'file-loader',
                outputPath: 'public/images'
              }
            },
            {
              loader: require.resolve('image-webpack-loader'),
              options: {
                mozjpeg: {
                  progressive: true,
                  quality: 65
                },
                pngquant: {
                  quality: '65-90',
                  speed: 4
                },
                gifsicle: {
                  interlaced: false
                },
                webp: {
                  quality: 75
                }
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new CleanWebpackPlugin(),
      // new webpack.ProvidePlugin({
      //   $: 'jquery',
      //   jQuery: 'jquery',
      //   'windows.jQuery': 'jquery'
      // }),
      new CopyWebpackPlugin([
        {
          from: './src/public',
          to: 'public'
        }
      ]),
      isProduction && new MiniCssExtractPlugin({
        filename: shouldHashName ? 'styles/[name].[contenthash:8].css' : 'styles/[name].css'
        // For chunks
        // chunkFilename: shouldHashName ? 'styles/[name].[contenthash:8].chunk.css' : 'styles/[name].chunk.css'
      }),
      // Generate an asset manifest file with the following content:
      // - "files" key: Mapping of all asset filenames to their corresponding
      //   output file so that tools can pick it up without having to parse
      //   `index.html`
      // - "entrypoints" key: Array of files which are included in `index.html`,
      //   can be used to reconstruct the HTML if necessary
      new ManifestPlugin({
        fileName: 'asset-manifest.json',
        publicPath: '/',
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path

            return manifest
          }, seed)
          const entrypointFiles = entrypoints.main.filter(
            fileName => !fileName.endsWith('.map')
          )

          return {
            files: manifestFiles,
            entrypoints: entrypointFiles
          }
        }
      }),
      // Ignore moment.js locales for lighter builds
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      new webpack.HashedModuleIdsPlugin(),
      shouldPreload && new PreloadWebpackPlugin({
        include: 'initial'
      }),
      new CssUrlRelativePlugin()
    ].filter(Boolean),
    devServer: {
      contentBase: srcDir,
      writeToDisk: false
    },
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /node_modules/,
            chunks: 'initial',
            name: 'vendor',
            priority: 10,
            enforce: true
          }
          // For code splitting
          // vendors: {
          //   test: /node_modules[/\\]((?!jquery|bootstrap).)*$/,
          //   chunks: 'initial',
          //   name: 'vendors',
          //   priority: 9,
          //   enforce: true
          // },
          // jquery: {
          //   test: /node_modules[/\\]jquery/,
          //   chunks: 'initial',
          //   name: 'jquery',
          //   priority: 10,
          //   enforce: true
          // },
          // bootstrap: {
          //   test: /node_modules[/\\]bootstrap/,
          //   chunks: 'initial',
          //   name: 'bootstrap',
          //   priority: 10,
          //   enforce: true
          // }
        }
      },
      minimizer: []
    }
  }

  if (shouldMinify) {
    const TerserPlugin = require('terser-webpack-plugin')
    const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

    config.optimization.minimizer.push(new TerserPlugin({
      include: /\.min\.js$/,
      parallel: true // Need specific number of CPUs for CI or other systems
    }))

    config.optimization.minimizer.push(
      new OptimizeCSSAssetsPlugin({
        assetNameRegExp: /\.min\.css$/
      })
    )
  }

  const files = glob.sync(path.join(srcDir, 'pages/*.html'))

  files.forEach(file => {
    config.plugins.push(
      new HtmlWebPackPlugin({
        filename: path.basename(file),
        template: file,
        favicon: path.resolve(path.join(srcDir, '/public/icon.ico')),
        minify: false
      })
    )
  })

  return config
}

module.exports = configWebpack
