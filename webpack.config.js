const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: path.resolve(__dirname, "src/main"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.glsl$/,
        loader: 'webpack-glsl-loader'
      },
    ]
  },
  resolve: {
    extensions: ['.ts', '.js' ],
  },
  devtool: 'source-map',
  devServer: {
    port: 5660,
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    client: {
      overlay: true,
    }
  },
};
