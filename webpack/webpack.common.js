const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const BuildManifestPlugin = require('./webpack.manifest');

require('dotenv').config();

const srcDir = path.join(__dirname, '..', 'src');

module.exports = (env) => ({
  entry: {
    popup: path.join(srcDir, 'popup.tsx'),
    background: path.join(srcDir, 'background.ts'),
    content_script: path.join(srcDir, 'content_script.ts'),
    injected: path.join(srcDir, 'injected.ts'),
  },
  output: {
    path: path.join(__dirname, '../dist/js'),
    filename: '[name].js',
  },
  optimization: {
    splitChunks: {
      name: 'vendor',
      chunks(chunk) {
        // exclude background because in MV3 we can't easily async import the vendor chunk
        // in the background service worker (without manual calls to `importScripts`)
        return chunk.name !== 'background';
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: '.', to: '../', context: 'public' }],
      options: {},
    }),
    new BuildManifestPlugin({
      browser: env.browser,
      pretty: env.mode === 'production',
    }),
    new webpack.DefinePlugin({
      'process.env.GA_API_TOKEN': JSON.stringify(process.env.GA_API_TOKEN),
    }),
  ],
});
