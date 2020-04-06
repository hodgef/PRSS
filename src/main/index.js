'use strict'

import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { format as formatUrl } from 'url';

const iconPath = path.join(__static, 'icons', 'icon.png');
const isDevelopment = process.env.NODE_ENV !== 'production';

const gotTheLock = app.requestSingleInstanceLock()

let mainWindow;

const createMainWindow = () => {
  let options = {
    icon: iconPath,
    width: 1380,
    height: 750,
    minWidth: 1380,
    minHeight: 750,
    webPreferences: {
      nodeIntegration: true
    }
  };

  if (!isDevelopment) {
    options = {
      ...options,
      devTools: false
    };
  } else {
    options = {
      ...options
    };
  }

  const window = new BrowserWindow(options);

  if (!isDevelopment) {
    Menu.setApplicationMenu(null);
  }

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
  app.on('ready', () => {});
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