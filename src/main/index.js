'use strict'

import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import { format as formatUrl } from 'url';

import { reactParser } from './parsers';

const iconPath = path.join(__static, 'icons', 'icon.png');
const isDevelopment = process.env.NODE_ENV !== 'production';

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow

const createMainWindow = () => {
  let options = {
    icon: iconPath,
    width: 1100,
    height: 725,
    minWidth: 1100,
    minHeight: 725,
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

  // TODO: Uncomment on prod
  //if (isDevelopment) {
    window.webContents.openDevTools();
  //}

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

  return window;
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


ipcMain.on('parse', (event, { parser, code }) => {
  let output = '';

  switch (parser) {
    case 'react':
      output = reactParser(code);
      break;
  
    default:
      break;
  }

  event.returnValue = output;
});