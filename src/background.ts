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
let enableNotifications: boolean = true

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

// get path to assets folder
function getAssetsPath() {
  // based on prod. or dev. env. path to assests change
  return isDevelopment ? path.join(__dirname, '../src/assets') : './resources/src/assets'
}

// initialize tray icon
function initTray(country?: string, ip?: string) {
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
      { type: 'separator' },
      { label: 'Refresh', type: 'normal', click: async () => { await setIPandCountry() } },
      { label: 'Notification', type: 'checkbox', checked: enableNotifications, click: () => { enableNotifications = !enableNotifications } },
      { label: 'Exit', type: 'normal', click: () => app.quit() }
    ])

    tray = new Tray(`${getAssetsPath()}/flags/${country || 'ZZ'}.png`)
    tray.setToolTip('IP to Country Tray' + (ip && country ? `\nIP: ${ip} (${country.toUpperCase()})` : ''))
    tray.setContextMenu(contextMenu)
  })
}

// chaneg tray icon based on given country code
function setTrayByCountry(country?: string, ip?: string) {
  tray.setToolTip('IP to Country Tray' + (ip && country ? `\nIP: ${ip} (${country.toUpperCase()})` : ''))
  tray.setImage(`${getAssetsPath()}/flags/${country || 'ZZ'}.png`)
}

// API call to get country which provided IP is
async function getIPCountry(ip: string) {
  try {
    const response = await axios.get(`https://ip2c.org/${ip}`)
    const result = response.data

    return result.split(';')[1]
  } catch (err) {
    return null
  }
}

// get public IP
async function getIP(): Promise<string> {
  try {
    return await publicIp.v4({ timeout: 1000 })
  } catch {
    return ''
  }
}

// show system notification
function showNotification(title: string, body: string): void {
  // when show-notifications flag is false there's nothing to do
  if (!enableNotifications) return

  if (!notification) {
    notification = new Notification({
      title,
      body,
      icon: `${getAssetsPath()}/icon.png`,
      timeoutType: 'never'
    })
  } else {
    notification.title = title
    notification.body = body
  }

  notification.show()
}

async function setIPandCountry(currentIP?: string): Promise<any> {
  const ip = await getIP()

  if (!ip) return null;

  if (ip !== currentIP) {
    const country = await getIPCountry(ip)

    setTrayByCountry(country, ip)

    return { ip, country };
  }

  return false;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  initTray()

  let previousIP: string = ""
  let prompt: boolean = true

  setIPandCountry()

  setInterval(async () => {
    const ip = await getIP()

    if (!ip) {
      if (prompt) {
        showNotification('Alert', 'No internet connection')
        setTrayByCountry()

        prompt = false
      }
    } else if (ip != previousIP) {
      const country = await getIPCountry(ip)

      showNotification('IP Changed!', `IP to Country Tray\nIP: ${ip} (${country.toUpperCase()})`)
      setTrayByCountry(country, ip)

      prompt = true
    }

    previousIP = ip
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
