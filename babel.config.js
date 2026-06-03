module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@core': './src/core',
            '@features': './src/features',
            '@navigation': './src/navigation',
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
      // Reanimated 4 ships its worklets babel plugin in react-native-worklets.
      // This MUST be the last plugin in the list.
      'react-native-worklets/plugin',
    ],
  };
};
