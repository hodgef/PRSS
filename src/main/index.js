'use strict'

import { app, BrowserWindow } from 'electron';
import path from 'path';
import { format as formatUrl } from 'url';

const iconPath = path.join(__static, 'icons', 'icon.png');
const isDevelopment = process.env.NODE_ENV !== 'production';
const gotTheLock = app.requestSingleInstanceLock();
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

app.allowRendererProcessReuse = false;
let mainWindow;

const createMainWindow = () => {
  const options = {
    icon: iconPath,
    frame: process.platform === 'darwin',
    width: 1250,
    height: 720,
    minWidth: 860,
    minHeight: 500,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  };

  if (!isDevelopment) {
    options = {
      ...options,
      devTools: false
    };
  }

  const window = new BrowserWindow(options);

  if (isDevelopment) {
    window.webContents.openDevTools();
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
  }
  else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }));
  }

  window.on('closed', () => {
    mainWindow = null
  });

  window.webContents.on('devtools-opened', () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  window.webContents.on('new-window', function(event, url) {
    event.preventDefault();
    require('electron').shell.openExternal(url);
  });

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

  return window;
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

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow();
});