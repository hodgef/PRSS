// Modules to control application life and create native browser window
const { app, shell, BrowserWindow, ipcMain } = require('electron');
import { initialize, enable } from "@electron/remote/main";
const path = require('path');

const iconPath = path.join(__static, 'icons', 'icon.png');
const isDevelopment = process.env.NODE_ENV !== 'production';
const gotTheLock = app.requestSingleInstanceLock();
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
const isPackaged = app.isPackaged;

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

const ElectronStore = require('electron-store');
ElectronStore.initRenderer();

initialize();

let mainWindow;
let appLink;
let eventSender;

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        title: "PRSS",
        icon: iconPath,
        frame: isDevelopment || process.platform === 'darwin',
        width: 1350,
        height: 750,
        minWidth: 900,
        minHeight: 500,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    enable(mainWindow.webContents);

    /**
     * Open URLs in browser by default
     */
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (!['https:', 'http:'].includes(new URL(url).protocol)) return;
      shell.openExternal(url);
      return { action: 'deny' };
    });

    if(isDevelopment){
        // load the index.html of the app.
        mainWindow.loadURL('http://localhost:9000');

        mainWindow.webContents.on('devtools-opened', () => {
          mainWindow.focus();
          setImmediate(() => {
            mainWindow.focus();
          });
        });

        // Open the DevTools.
        mainWindow.webContents.openDevTools();
    } else {
        // load the index.html of the app.
        const indexPrefix = isPackaged ? 'build/' : '';
        mainWindow.loadFile(indexPrefix + "index.html");
    }

    function setLog(text) {
      log.info(text);
    }
    autoUpdater.on('checking-for-update', () => {
      setLog('Checking for update...');
    })
    autoUpdater.on('update-available', () => {
      setLog('Update available.');
    })
    autoUpdater.on('update-not-available', () => {
      setLog('Update not available.');
    })
    autoUpdater.on('error', (err) => {
      setLog('Error in auto-updater. ' + err);
    })
    autoUpdater.on('download-progress', (progressObj) => {
      let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
      log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
      log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
      setLog(log_message);
    })
    autoUpdater.on('update-downloaded', () => {
      setLog('Update downloaded');
    });

    /**
     * Preview server
     */
    const previewServer = require("browser-sync").create("prss");

    (global as any).stopPreview = () => {
      if (previewServer.active) {
        previewServer.notify("PRSS Preview Stopped", 3000);
        previewServer.exit();
      }
    }

    (global as any).openDevTools = () => {
      mainWindow.webContents.openDevTools();
    }

    (global as any).reloadPreview = () => {
      previewServer.reload();
    }

    (global as any).pausePreview = () => {
      previewServer.pause();
    }

    (global as any).resumePreview = () => {
      previewServer.resume();
    }

    (global as any).isPreviewActive = () => {
      return previewServer.active;
    }

    (global as any).startPreview = (options) => {
      global.stopPreview();

      if (!previewServer.active) {
        previewServer.init(options);
        // previewServer.watch('*').on('change', previewServer.reload);
        previewServer.notify("PRSS Preview Started", 3000);
        // toast.success('Starting PRSS Preview');
      }
    }

    (global as any).getAppLink = () => {
      return appLink;
    }
}

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      handleProtocolLaunch(commandLine);
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // Check for updates
  if(!process.resourcesPath?.includes("WindowsApps")){
    autoUpdater.checkForUpdatesAndNotify();
  }
  
  // Handle protocol launch
  handleProtocolLaunch(process.argv);

  process.on('exit', () => {
    app.quit();
  });

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// Handle protocol launch
const handleProtocolLaunch = (argv: any[]) => {
  const caller = argv[argv.length - 1];

  if(caller){
    appLink = caller.includes("prss:") ? caller : null;

    if(eventSender) {
      eventSender.send("protocol-received", appLink);
    }
  }
}

ipcMain.on("prss-ready", (event) => {
  eventSender = event.sender;

  if(appLink){
    eventSender.send("protocol-received", appLink);
  }
});