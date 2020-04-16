const path = require('path')
const glob = require('glob')
const { omitBy, flatten, uniq, map, keys } = require('lodash')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const PreloadWebpackPlugin = require('preload-webpack-plugin')
const CssUrlRelativePlugin = require('css-url-relative-plugin')
const ManifestPlugin = require('webpack-manifest-plugin')
const safePostCssParser = require('postcss-safe-parser')
const TerserPlugin = require('terser-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const PurgecssPlugin = require('purgecss-webpack-plugin')
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin')

/* eslint-disable complexity */
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
    shouldPreloadFonts,
    shouldHashName,
    shouldGenerateManifest,
    shouldOpenWebpage,
    shouldPurgeCss,
    // paths
    rootDir,
    srcDir,
    buildDir,
    entry,
    excludedAssets,
    copies
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
        // allow parsing image src
        {
          test: /\.html$/,
          use: [
            {
              loader: require.resolve('html-loader'),
              options: {
                minimize: false
              }
            }
          ]
        },
        {
          test: /\.pug$/,
          use: [
            {
              loader: require.resolve('pug-loader'),
              options: {
                minimize: false
              }
            }
          ]
        },
        {
          test: /\.m?js$/,
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
          test: /\.(sc|sa|c)ss$/,
          use: getStyleLoaders(
            {
              importLoaders: 3
            },
            'sass-loader'
          )
        },
        {
          test: /\.(gif|png|jpe?g|svg)$/i,
          exclude: /fonts/,
          use: [
            {
              loader: require.resolve('url-loader'),
              options: {
                esModule: false, // allow parsing image src
                limit: isProduction ? 0 : 8192, // export files on production
                name: '[name].[ext]',
                fallback: 'file-loader',
                outputPath: 'public/images'
              }
            }
            // {
            //   loader: require.resolve('image-webpack-loader'),
            //   options: {
            //     mozjpeg: {
            //       progressive: true,
            //       quality: 65
            //     },
            //     pngquant: {
            //       quality: [0.65, 0.95],
            //       speed: 4
            //     },
            //     gifsicle: {
            //       interlaced: false
            //     },
            //     webp: {
            //       quality: 75
            //     }
            //   }
            // }
          ].filter(Boolean)
        },
        {
          test: /fonts|\.(woff|woff2|eot|ttf)$/i,
          use: [
            // {
            //   loader: require.resolve('url-loader'),
            //   options: {
            //     limit: 8192,
            //     name: '[name].[ext]',
            //     fallback: 'file-loader',
            //     outputPath: 'public/fonts'
            //   }
            // }
            {
              loader: require.resolve('file-loader'),
              options: {
                name: '[name].[ext]',
                outputPath: 'public/fonts'
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
      new CopyWebpackPlugin(copies),
      isProduction && new MiniCssExtractPlugin({
        filename: shouldHashName ? 'styles/[name].[contenthash:8].css' : 'styles/[name].css'
        // For chunks
        // chunkFilename: shouldHashName ? 'styles/[name].[contenthash:8].chunk.css' : 'styles/[name].chunk.css'
      }),
      shouldPurgeCss && new PurgecssPlugin({
        paths: glob.sync(`${srcDir}/**/*`, { nodir: true }),
        whitelistPatterns: [] // static selectors for elements generated by 3rd party JS
      }),
      // Generate an asset manifest file with the following content:
      // - "files" key: Mapping of all asset filenames to their corresponding
      //   output file so that tools can pick it up without having to parse
      //   `index.html`
      // - "entrypoints" key: Array of files which are included in `index.html`,
      //   can be used to reconstruct the HTML if necessary
      shouldGenerateManifest && new ManifestPlugin({
        fileName: 'asset-manifest.json',
        publicPath: '/',
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path

            return manifest
          }, seed)

          const entrypointFiles = flatten(uniq(map(entrypoints, (entryFiles, entryName) => {
            if (entryName.includes('.min')) return false // minified

            return entryFiles.filter(
              fileName => !fileName.endsWith('.map')
            )
          }).filter(Boolean)))

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
      // preload fonts only
      shouldPreloadFonts && new PreloadWebpackPlugin({
        include: 'allAssets',
        as: 'font',
        fileWhitelist: [
          /\.woff$/i
        ]
      }),
      new CssUrlRelativePlugin()
    ].filter(Boolean),
    devServer: {
      contentBase: srcDir,
      writeToDisk: false,
      open: shouldOpenWebpage
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
        }
      },
      minimizer: []
    }
  }

  if (shouldMinify) {
    config.optimization.minimizer.push(new TerserPlugin({
      include: /\.min\.js$/,
      parallel: true // Need specific number of CPUs for CI or other systems
    }))

    config.optimization.minimizer.push(
      new OptimizeCSSAssetsPlugin({
        assetNameRegExp: /\.min\.css$/,
        cssProcessorOptions: {
          parser: safePostCssParser,
          map: shouldUseSourceMap
            ? {
              // `inline: false` forces the sourcemap to be output into a
              // separate file
              inline: false,
              // `annotation: true` appends the sourceMappingURL to the end of
              // the css file, helping the browser find the sourcemap
              annotation: true
            }
            : false
        },
        cssProcessorPluginOptions: {
          preset: ['default', { minifyFontValues: { removeQuotes: false } }]
        }
      })
    )
  }

  // [!_] is for layout ignore
  const files = glob.sync(path.join(srcDir, 'pages', '[!_]*.{html,pug}'))
  const injectedChunks = shouldMinify ? omitBy(entry, (_, f) => !f.includes('.min')) : entry

  files.forEach(file => {
    config.plugins.push(
      new HtmlWebpackPlugin({
        filename: `${path.basename(file, path.extname(file))}.html`,
        template: file,
        favicon: path.resolve(path.join(srcDir, '/assets/images/favicon.ico')),
        minify: false,
        chunks: keys(injectedChunks),
        excludeAssets: excludedAssets
      })
    )
  })

  config.plugins.push(new HtmlWebpackExcludeAssetsPlugin())

  return config
}

module.exports = configWebpack
