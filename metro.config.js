const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add polyfills for Node.js core modules
config.resolver.extraNodeModules = {
  stream: require.resolve('readable-stream'),
  crypto: require.resolve('react-native-crypto'),
  buffer: require.resolve('buffer/'),
  util: require.resolve('util/'),
  assert: require.resolve('assert/'),
  fs: false,
  path: require.resolve('path-browserify'),
  zlib: require.resolve('browserify-zlib'),
  http: require.resolve('stream-http'),
  https: require.resolve('https-browserify'),
  os: require.resolve('os-browserify/browser'),
  url: require.resolve('url/'),
  net: path.resolve(__dirname, 'mocks/net.js'),
  tls: path.resolve(__dirname, 'mocks/tls.js'),
  child_process: false,
  ws: path.resolve(__dirname, 'mocks/ws.js'),
};

// Add WebSocket and related modules to the blocklist
config.resolver.blockList = [
  /.*\/node_modules\/ws\/.*/,
  /.*\/node_modules\/tls\/.*/,
  /.*\/node_modules\/net\/.*/,
];

// Add additional module resolution paths
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, 'mocks'),
];

module.exports = config; 