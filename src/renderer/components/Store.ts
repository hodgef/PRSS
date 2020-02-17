import { createContext } from 'react';
import Store from 'electron-store';

const AppContext = createContext(null);

const store = new Store({
    name: "PRSS"
});

export { AppContext, store };