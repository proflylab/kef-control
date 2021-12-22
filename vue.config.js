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
        },
        mac: {
          target: [
            {
              target: 'dmg',
              arch: ['x64']
            }
          ],
          icon: 'build/512x512.png'
        },
        linux: {
          target: [
            {
              target: 'AppImage',
              arch: ['x64']
            }
          ],
          category: 'Audio',
          icon: 'build/256x256.png'
        },
        appImage: {
          category: 'Audio'
        }
      }
    }
  }
}
