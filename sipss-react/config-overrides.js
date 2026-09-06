const path = require("path");

module.exports = function override(config) {
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...config.resolve.alias,
    "@": path.resolve(__dirname, "src"),
    "xlsx": path.resolve(__dirname, "node_modules/xlsx/dist/xlsx.full.min.js"),
  };
  return config;
};
