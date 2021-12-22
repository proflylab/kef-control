'use strict'

import { BrowserWindow, app, ipcMain, protocol } from 'electron'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'

import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import { socket } from './scripts'

require('@electron/remote/main').initialize()
const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 500,
    height: 250,
    frame: false,
    minimizable: true,
    fullscreenable: false,
    resizable: true,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      webSecurity: false,
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      enableRemoteModule: true
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  // handle socket
  socket.client.on('data', (buffer) => {
    switch (true) {
      case socket.verify(buffer, [0x52, 0x30, 0x81]):
        win.webContents.send('source', buffer[3])
        break
      case socket.verify(buffer, [0x52, 0x25, 0x81]):
        win.webContents.send('volume', buffer[3])
        break
      case socket.verify(buffer, [0x52, 0x11, 0xff]):
        // packet success?
        break
      default:
        console.log('unknown', buffer)
        break
    }
  })

  socket.client.on('close', () => {})

  ipcMain.on('show-tray', () => {
    win.show()
    win.focus()
  })

  ipcMain.on('hide-tray', () => win.hide())

  ipcMain.on('connect', (event, ...args) => {
    socket.client
      .connect(+args[1], args[0], () => {
        event.sender.send('connected', true)
        socket.client.write(socket.msg.getSource)
        socket.client.write(socket.msg.getVolume)
      })
      .on('error', (e) => {
        event.sender.send('connected', false)
        console.error(e.message)
      })
  })

  ipcMain.on('disconnect', (event) => {
    socket.client.write(socket.msg.turnOff)
    socket.client.destroy()
    event.sender.send('connected', false)
  })

  ipcMain.on('volume', (_, ...args) => {
    let value = args[0]
    socket.client.write(Buffer.from([0x53, 0x25, 0x81, value, 0x1a]))
  })

  ipcMain.on('turn-on', (_, ...args) => {
    socket.client.write(socket.source[args[0]])
  })

  ipcMain.on('close-window', () => app.exit())

  ipcMain.on('minimize-window', () => win.minimize())
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => socket.client.destroy())

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
