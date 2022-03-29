// Modules to control application life and create native browser window
const { app, shell, BrowserWindow } = require('electron');
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

initialize();

let mainWindow;

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        title: "PRSS",
        icon: iconPath,
        frame: isDevelopment || process.platform === 'darwin',
        width: 1250,
        height: 720,
        minWidth: 860,
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
        mainWindow.webContents.openDevTools()
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
    autoUpdater.on('update-available', (info) => {
      setLog('Update available.');
    })
    autoUpdater.on('update-not-available', (info) => {
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
    autoUpdater.on('update-downloaded', (info) => {
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
}

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  })

  // Create myWindow, load the rest of the app, etc...
  app.on('ready', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.