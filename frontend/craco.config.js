const path = require('path');

module.exports = {
  webpack: {
    alias: {
      // Complete fix for Zustand shallow export compatibility with Wagmi
      'zustand/shallow$': path.resolve(__dirname, 'src/utils/zustand-shallow-complete.js'),
    },
    configure: (webpackConfig) => {
      // Ignore source map warnings for node_modules
      webpackConfig.ignoreWarnings = [
        {
          module: /node_modules/,
        },
      ];
      
      // Additional webpack configuration for module resolution
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        alias: {
          ...webpackConfig.resolve.alias,
          'zustand/shallow': path.resolve(__dirname, 'src/utils/zustand-shallow-complete.js'),
        },
        fallback: {
          ...webpackConfig.resolve.fallback,
          'zustand/shallow': path.resolve(__dirname, 'src/utils/zustand-shallow-complete.js'),
        },
      };
      
      // Add module rules for better compatibility
      webpackConfig.module.rules.push({
        test: /zustand-shallow-complete\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-modules-commonjs']
          }
        }
      });
      
      return webpackConfig;
    },
  },
  eslint: {
    enable: false, // Disable ESLint temporarily to focus on the core functionality
  },
};
