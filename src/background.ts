'use strict'

// node modules
import path from 'path'

// 3rd-part modules
import axios from 'axios'
import publicIp from 'public-ip'
import { app, dialog, Menu, Notification, protocol, Tray } from 'electron'
import { MessageBoxOptions } from 'electron/main'

// defines
const isDevelopment = process.env.NODE_ENV !== 'production'
let tray: Tray
let notification: Notification

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

function getAssetsPath() {
  return isDevelopment ? path.join(__dirname, '../src/assets') : './resources/src/assets'
}

function initTray(country?: String, ip?: String) {
  app.whenReady().then(() => {
    const aboutDialogOptions: MessageBoxOptions = {
      type: 'none',
      title: 'About',
      message: `
        IP to Country Tray by Arbie Sarkissian
        2021
      `,
      detail: `
        Flags by: https://dribbble.com/shots/1089488-Stripe-Flag-Set
        Icon by: https://www.iconfinder.com/icons/4254451/address_dedicated_ip_icon`
    }
    const contextMenu = Menu.buildFromTemplate([
      { label: 'About...', type: 'normal', click: () => dialog.showMessageBox(aboutDialogOptions) },
      { label: 'Exit', type: 'normal', click: () => app.quit() }
    ])

    tray = new Tray(`${getAssetsPath()}/flags/${country || 'am'}.png`)
    tray.setToolTip('IP to Country Tray' + (ip && country ? `\nIP: ${ip} (${country.toUpperCase()})` : ''))
    tray.setContextMenu(contextMenu)
  })
}

function setTrayByCountry(country: String) {
  tray.setImage(`${getAssetsPath()}/flags/${country}.png`)
}

async function getIPCountry(ip: String) {
  try {
    const response = await axios.get(`https://ip2c.org/${ip}`)
    const result = response.data

    return result.split(';')[1]
  } catch (err) {
    return null
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  let previousIP = await publicIp.v4()
  notification = new Notification({
    title: 'IP changed!',
    body: '',
    icon: `${getAssetsPath()}/icon.png`,
    timeoutType: 'never'
  })

  initTray(await getIPCountry(previousIP), previousIP)
  setInterval(async () => {
    const ip = await publicIp.v4()

    if (ip !== previousIP) {
      const country: String = await getIPCountry(ip)

      notification.body = `${ip} (${country.toUpperCase()})`
      setTrayByCountry(country)
      tray.setToolTip(`IP to Country Tray\nIP: ${ip} (${country.toUpperCase()})`)
      previousIP = ip

      notification.show()
    }
  }, 5000)
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
