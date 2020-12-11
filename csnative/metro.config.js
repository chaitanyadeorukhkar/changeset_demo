const universeMetroConfig = require('@razorpay/universe-cli/metro.config');
const { mergeConfig } = require('metro-config');

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-typescript-transformer'),
  },
};

module.exports = mergeConfig(universeMetroConfig, config);
