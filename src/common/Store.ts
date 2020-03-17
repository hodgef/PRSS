import Store from 'electron-store';
import path from 'path';
import { createContext } from 'react';
const isDevelopment = process.env.NODE_ENV !== 'production';

const AppContext = createContext(null);

const defaults = {
    sites: {},
    paths: {}
} as IStore;

const store = new Store({
    name: 'PRSS',
    encryptionKey: isDevelopment ? null : 'PRSS',
    defaults
});

store.set({
    paths: {
        buffer: path.join(__static, 'buffer'),
        vendor: path.join(__static, 'vendor'),
        themes: path.join(__static, 'themes')
    }
});

export { AppContext, store };
