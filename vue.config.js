module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: "com.sarkissians",
        productName: "IP to Country Tray",
        files: ['**/*', 'src/assets/icon.*'],
        extraResources: [
          'src/assets/flags/**',
          'src/assets/icon.*'
        ]
      }
    }
  }
}
