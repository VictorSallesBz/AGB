import { app, shell, BrowserWindow, ipcMain, Tray } from "electron"
import { join } from "path"
import log from "electron-log"
import { createTray } from "@main/tray"
import { setupPowerShellHandlers } from "@main/powershell"
import { setupSystemHandlers } from "@main/system"
import { setupTweaksHandlers } from "@main/tweakHandler"
import { setupDNSHandlers } from "@main/dnsHandler"
import { setupBackupHandlers } from "@main/backup"
import { setupDebloatHandlers } from "@main/debloat"
import { initAutoUpdater } from "@main/updates"
import { setMainWindow } from "@main/windowState"
import Store from "electron-store"
import { is, getResourcePath } from "@main/utils"
import { startDiscordRPC, setupRpcHandlers } from "@main/rpc"

console.log = log.log
console.error = log.error
console.warn = log.warn

log.initialize()

const store = new Store()

let trayInstance: Tray | null = null
if (store.get("showTray") === undefined) {
  store.set("showTray", false)
}

ipcMain.handle("tray:get", () => {
  return store.get("showTray")
})
ipcMain.handle("tray:set", (_event: Electron.IpcMainInvokeEvent, value: boolean) => {
  store.set("showTray", value)
  if (mainWindow) {
    if (value) {
      if (!trayInstance) {
        trayInstance = createTray(mainWindow)
      }
    } else {
      if (trayInstance) {
        trayInstance.destroy()
        trayInstance = null
      }
    }
  }
  return store.get("showTray")
})

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  console.log("[AGB]: createWindow called")
  console.log("[AGB]: __dirname =", __dirname)
  console.log("[AGB]: icon path =", getResourcePath("agb.ico"))
  console.log("[AGB]: preload path =", join(__dirname, "../preload/index.js"))
  console.log("[AGB]: renderer path =", join(__dirname, "../renderer/index.html"))

  try {
    mainWindow = new BrowserWindow({
      title: "AGB - Advanced Gaming Booster",
      width: 1380,
      backgroundColor: "#111214",
      height: 760,
      minWidth: 790,
      minHeight: 560,
      center: true,
      frame: false,
      show: false,
      autoHideMenuBar: true,
      icon: getResourcePath("agb.ico"),
      webPreferences: {
        preload: join(__dirname, "../preload/index.js"),
        devTools: app.isPackaged ? false : true,
        sandbox: false,
        spellcheck: false,
      },
    })
    console.log("[AGB]: BrowserWindow created")
    setMainWindow(mainWindow)
  } catch (err: any) {
    console.error("[AGB]: BrowserWindow creation failed:", err)
    throw err
  }

  mainWindow.webContents.setWindowOpenHandler((details: Electron.HandlerDetails) => {
    shell.openExternal(details.url)
    return { action: "deny" }
  })

  const devUrl = process.env["ELECTRON_RENDERER_URL"] || (is.dev || !app.isPackaged ? "http://localhost:5173" : null)
  if (devUrl) {
    console.log("[AGB]: Loading renderer from URL:", devUrl)
    mainWindow.loadURL(devUrl).catch((err) => {
      console.warn("[AGB]: Failed to load dev URL, falling back to local file:", err)
      mainWindow?.loadFile(join(__dirname, "../renderer/index.html"))
    })
  } else {
    console.log("[AGB]: Loading renderer from file")
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"))
  }

  mainWindow.once("ready-to-show", () => {
    console.log("[AGB]: Window ready to show")
    mainWindow!.maximize()
    mainWindow!.show()
  })

  mainWindow.webContents.on(
    "did-fail-load",
    (_event: Electron.Event, errorCode: number, errorDescription: string) => {
      console.error("[AGB]: Renderer failed to load:", errorCode, errorDescription)
    },
  )
}
app.commandLine.appendSwitch("no-sandbox")
app
  .whenReady()
  .then(() => {
    console.log("[AGB]: App ready, creating window...")
    try {
      createWindow()
      console.log("[AGB]: Window created successfully")
    } catch (err: any) {
      console.error("[AGB]: createWindow failed:", err)
    }
    initAutoUpdater(() => mainWindow)
    console.log("[AGB]: Auto updater initialized")
    if (store.get("showTray")) {
      console.log("[AGB]: Creating tray...")
      try {
        trayInstance = createTray(mainWindow!)
        console.log("[AGB]: Tray created")
      } catch (err: any) {
        console.error("[AGB]: Tray creation failed:", err)
      }
    }
    setupPowerShellHandlers()
    setupSystemHandlers()
    setupTweaksHandlers()
    setupDNSHandlers()
    setupBackupHandlers()
    setupDebloatHandlers()
    setupRpcHandlers()
    if (store.get("rpcEnabled") === true) {
      startDiscordRPC()
    }
    console.log("[AGB]: Handlers setup complete")

    ipcMain.on("window-minimize", () => {
      if (mainWindow) mainWindow.minimize()
    })

    ipcMain.on("window-toggle-maximize", () => {
      if (mainWindow) {
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize()
        } else {
          mainWindow.maximize()
        }
      }
    })

    ipcMain.on("window-close", () => {
      if (mainWindow) {
        if (store.get("showTray")) {
          mainWindow.hide()
        } else {
          app.quit()
        }
      }
    })

    ipcMain.handle("open-devtools", () => {
      if (mainWindow) {
        mainWindow.webContents.openDevTools()
      }
    })

    app.on("activate", function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    app.on("window-all-closed", () => {
      if (!store.get("showTray") && process.platform !== "darwin") {
        app.quit()
      }
    })
  })
  .catch((err: any) => {
    console.error("[AGB]: app.whenReady failed:", err)
  })
