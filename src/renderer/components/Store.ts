import { createContext } from 'react';
import Store from 'electron-store';

const AppContext = createContext(null);

const defaults = {
    sites: []
};

const store = new Store({
    name: "PRSS",
    defaults,
});

export { AppContext, store };