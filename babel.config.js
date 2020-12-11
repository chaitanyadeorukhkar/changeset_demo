module.exports = function babelConfig(api) {
  // Source: https://babeljs.io/docs/en/config-files#apicache
  // P.S: Caching is hard:P. Need to check in which scenarios this will fail
  api.cache(true);
  return {
    presets: ['@razorpay/universe-cli/babel.react'],
    plugins: [],
  };
};
