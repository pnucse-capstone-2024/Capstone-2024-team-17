const path = require('path'); // path 모듈 추가
const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  outputDir: path.resolve(__dirname, "./coffeeshop"), // path 모듈 사용
});
