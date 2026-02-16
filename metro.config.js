const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// 支持 .bin 模型文件
config.resolver.assetExts.push('bin');

module.exports = withNativeWind(config, { input: "./styles/global.css" });
