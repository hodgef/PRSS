// import os from 'os';
import Store from 'electron-store';
import path from 'path';
import { createContext } from 'react';

const AppContext = createContext(null);

const defaults = {
    sites: {},
    paths: {}
} as IStore;

const store = new Store({
    name: 'PRSS',
    // encryptionKey: os.hostname(),
    defaults
});

store.set({
    paths: {
        themes: path.join(__static, 'themes')
    }
});

export { AppContext, store };