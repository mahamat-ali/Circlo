const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { getDefaultConfig: getDefaultExpoConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultExpoConfig(__dirname);
const config = getDefaultConfig(__dirname);

// Add SVG support
config.transformer = {
  ...defaultConfig.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};
config.resolver = {
  ...defaultConfig.resolver,
  assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
  sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
};

module.exports = withNativeWind(config, { input: "./global.css" });
