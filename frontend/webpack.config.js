module.exports = {
  module: {
    loaders: [
      {
        test: /\.ico$/,
        loader: 'file-loader?name=[name].[ext]',  // <-- retain original file name
      },
    ],
  },
};
