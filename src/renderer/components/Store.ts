import { createContext } from 'react';
// import os from 'os';
import Store from 'electron-store';

const AppContext = createContext(null);

const defaults = {
    sites: {}
};

const store = new Store({
    name: "PRSS",
    // encryptionKey: os.hostname(),
    defaults,
});

export { AppContext, store };