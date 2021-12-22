module.exports = {
  productionSourceMap: false,
  pluginOptions: {
    electronBuilder: {
      removeElectronJunk: false,
      nodeIntegration: true,
      builderOptions: {
        appId: 'app.kef.control',
        productName: 'KEFControl',
        copyright: 'Copyright © 2021 Proflylab',
        win: {
          target: [
            {
              target: 'portable',
              arch: ['x64']
            }
          ],
          icon: 'build/512x512.png'
        }
      }
    }
  }
}
