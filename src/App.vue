<template>
  <n-config-provider :theme="darkTheme" :locale="enUS">
    <n-input-group>
      <div class="w-full draggable">
        <div class="ml-3 mt-2 text-white font-bold">KEF Control (LSX)</div>
      </div>
      <n-button
        type="info"
        :style="{ width: '10%' }"
        size="small"
        quaternary
        class="mt-1"
        @click="minimizeWindow()"
        >_</n-button
      >
      <n-button
        type="error"
        :style="{ width: '10%' }"
        size="small"
        quaternary
        class="mt-1 mr-1"
        @click="hideTray()"
        >x</n-button
      >
    </n-input-group>
    <div class="m-3 mt-1">
      <n-space vertical :size="12">
        <n-input-group v-if="isConnected">
          <n-button type="error" block ghost @click="disconnect()"
            >Disconnect (TurnOff)</n-button
          >
        </n-input-group>
        <n-input-group v-else>
          <n-input-group-label>IP</n-input-group-label>
          <n-input :style="{ width: '70%' }" v-model:value="host.ip" />
          <n-input :style="{ width: '30%' }" v-model:value="host.port" />
          <n-button type="primary" ghost @click="connect(host.ip, host.port)"
            >Connect</n-button
          >
        </n-input-group>
        <n-space justify="space-around" size="large">
          <n-button
            circle
            ghost
            type="default"
            size="large"
            @click="turnOn('Wifi')"
            :disabled="!isConnected"
            >Wifi</n-button
          >
          <n-button
            circle
            ghost
            type="info"
            size="large"
            @click="turnOn('Bluetooth')"
            :disabled="!isConnected"
            >BT</n-button
          >
          <n-button
            circle
            ghost
            color="#ff69b4"
            size="large"
            @click="turnOn('Opt')"
            :disabled="!isConnected"
            >OPT</n-button
          >
          <n-button
            circle
            ghost
            type="warning"
            size="large"
            @click="turnOn('Aux')"
            :disabled="!isConnected"
            >AUX</n-button
          >
        </n-space>
        <n-card class="text-center select-none">{{
          currentSourceText || 'Please connect your speaker'
        }}</n-card>
        <n-space vertical>
          <n-slider
            v-model:value="value.volume"
            :step="1"
            :disabled="!isConnected"
          />
        </n-space>
      </n-space>
    </div>
  </n-config-provider>
</template>

<script>
import { defineComponent, ref } from 'vue'
import {
  NConfigProvider,
  NButton,
  NSpace,
  NSlider,
  NInput,
  NInputGroup,
  NInputGroupLabel,
  NCard
} from 'naive-ui'
// theme
import { darkTheme } from 'naive-ui'
// locale & dateLocale
import { enUS } from 'naive-ui'
// electron
import { ipcRenderer } from 'electron'
import { join } from 'path'
import { Menu, MenuItem, Tray } from '@electron/remote'

export default defineComponent({
  components: {
    NConfigProvider,
    NSpace,
    NButton,
    NSlider,
    NInput,
    NInputGroup,
    NInputGroupLabel,
    NCard
  },
  setup() {
    return {
      darkTheme,
      enUS,
      isConnected: ref(false),
      host: ref({
        ip: '192.168.1.103',
        port: '50001'
      }),
      value: ref({
        source: 'Opt',
        volume: 50
      }),
      currentSource: ref(null),
      currentSourceText: ref(null),
      source: ref({
        Wifi: 'Wifi Mode',
        Bluetooth: 'Bluetooth Mode',
        Aux: 'Playback control is not supported in AUX Mode',
        Opt: 'Playback control is not supported in OPT Mode',
        Usb: 'USB Mode',
        TurnOff: 'The speaker is Standby Mode Press a source to power on'
      }),
      table: ref({
        18: 'Wifi',
        25: 'Bluetooth',
        26: 'Aux',
        27: 'Opt',
        28: 'Usb',
        31: 'Bluetooth',
        155: 'TurnOff'
      }),
      tray: null
    }
  },
  created() {
    this.buildTray()
  },
  beforeUnmount() {
    if (this.tray) this.tray.destroy()
  },
  mounted() {
    ipcRenderer.on('connected', (_, connected) => {
      this.isConnected = connected
    })
    ipcRenderer.on('source', (_, value) => {
      console.log('source', value)
      this.currentSource = this.table[value]
      this.currentSourceText = this.source[this.table[value]]
    })
    ipcRenderer.on('volume', (_, value) => {
      this.value.volume = value
    })
  },
  watch: {
    'value.volume'(value) {
      ipcRenderer.send('volume', value)
      this.buildTray()
    }
  },
  methods: {
    connect(ip, port) {
      ipcRenderer.send('connect', ip, port)
    },
    disconnect() {
      this.currentSource = null
      this.currentSourceText = null
      ipcRenderer.send('disconnect')
    },
    turnOn(value) {
      this.currentSource = value
      this.currentSourceText = this.source[value]
      this.buildTray()
      ipcRenderer.send('turn-on', value)
    },
    hideTray() {
      ipcRenderer.send('hide-tray')
    },
    closeWindow() {
      ipcRenderer.send('close-window')
    },
    minimizeWindow() {
      ipcRenderer.send('minimize-window')
    },
    buildMenu() {
      const menu = new Menu()

      menu.append(
        new MenuItem({
          label: 'Open KEF Control',
          click: () => ipcRenderer.send('show-tray')
        })
      )
      menu.append(
        new MenuItem({
          type: 'separator'
        })
      )
      menu.append(
        new MenuItem({
          label: 'Mute'
          // click: () => this.togglePlaying()
        })
      )
      menu.append(
        new MenuItem({
          label: 'Unmute'
          // click: () => this.togglePlaying()
        })
      )
      menu.append(
        new MenuItem({
          label: `Volume ${this.value.volume}%`,
          enabled: false
          // click: () => this.togglePlaying()
        })
      )
      menu.append(
        new MenuItem({
          type: 'separator'
        })
      )
      menu.append(
        new MenuItem({
          label:
            this.currentSource !== null
              ? `Source ${this.currentSource}`
              : 'Offline',
          enabled: false
        })
      )
      menu.append(
        new MenuItem({
          type: 'separator'
        })
      )
      menu.append(
        new MenuItem({
          label: 'Quit',
          click: () => ipcRenderer.send('close-window')
        })
      )

      return menu
    },
    buildTray() {
      if (!this.tray) {
        // eslint-disable-next-line no-undef
        this.tray = new Tray(join(__static, 'icon.png'))
        this.tray.on('click', () => ipcRenderer.send('show-tray'))
      }
      this.tray.setToolTip('KEF Control')
      this.tray.setContextMenu(this.buildMenu())
    }
  }
})
</script>

<style>
body {
  background: #121414;
}

.draggable {
  -webkit-user-select: none;
  user-select: none;
  -webkit-app-region: drag;
}
</style>
