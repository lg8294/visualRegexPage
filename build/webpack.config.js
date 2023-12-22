const { resolve } = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const path = require("path");
const { getLocalIdent } = require("./getLocalIdent");

const isDev = process.env.NODE_ENV !== "production";

const prjDir = path.join(__dirname, "../");
const distDir = path.resolve(prjDir, "visual-regex");

const cssLoader = {
  loader: "css-loader",
  options: {
    modules: {
      getLocalIdent: (context, localIdentName, localName, options) => {
        if (isDev) return localName;
        return getLocalIdent(context, localIdentName, localName, options);
      },
    },
  },
};

let config = {
  mode: isDev ? "development" : "production",
  entry: {
    index: resolve(prjDir, "src/js/index.js"),
  },
  devServer: {
    port: 9000,
    open: true,
  },
  output: {
    clean: true,
    path: distDir,
    filename: isDev ? "[name].js" : "[contenthash].js",
    // filename: "[contenthash].js",
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: isDev ? "[name].css" : "[contenthash].css",
      // filename: "[contenthash].css",
    }),
    new HtmlWebpackPlugin({
      filename: "index.html",
      favicon: resolve(prjDir, "./src/favicon.ico"),
      template: resolve(prjDir, "./src/index.html"),
      minify: !isDev,
    }),
    new webpack.BannerPlugin({
      banner: "lg8294",
      //   raw: true,
    }),
    new CopyPlugin({
      patterns: [
        { from: "public", to: distDir },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.less$/i,
        use: [MiniCssExtractPlugin.loader, cssLoader, "less-loader"],
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, cssLoader],
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: { drop_console: false && !isDev },
        },
        extractComments: false,
      }),
      new CssMinimizerPlugin(),
    ],
  },
};

if (isDev) config.devtool = "inline-source-map";

module.exports = config;
