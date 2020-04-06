import Store from 'electron-store';
import path from 'path';
import { createContext } from 'react';
const isDevelopment = process.env.NODE_ENV !== 'production';

const AppContext = createContext(null);

const defaults = {
    sites: {}
} as IStore;

const defaultsInt = {
    sites: {},
    paths: {}
} as IStoreInternal;

let store;
let storeInt;

const initStore = () => {
    return new Promise(async resolve => {
        if (store && storeInt) {
            resolve();
        }

        const storePath = await localStorage.getItem('storePath');
        const baseStorePath = storePath
            ? storePath.replace('PRSS.json', '')
            : null;

        store = new Store({
            name: 'PRSS',
            defaults,
            ...(baseStorePath ? { cwd: baseStorePath } : {})
        });

        storeInt = new Store({
            name: 'PRSS_Internal',
            encryptionKey: isDevelopment ? null : 'PRSS_Internal',
            defaults: defaultsInt
        });

        storeInt.set({
            paths: {
                buffer: path.join(__static, 'buffer'),
                public: path.join(__static, 'public'),
                themes: path.join(__static, 'themes'),
                vendor: path.join(__static, 'vendor')
            }
        });

        resolve();
    });
};

export { AppContext, initStore, store, storeInt };
