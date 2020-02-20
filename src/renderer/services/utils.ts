import { remote } from 'electron';

import { store } from '../components/Store';
import strings from '../strings.json';
const { dialog } = remote;

export const setSite = (data: ISite) => {
    const { id: siteId } = data;
    const sites = get('sites');

    set({
        sites: merge(sites, { [siteId]: { id: siteId, ...data }  })
    });
}

export const merge = (var1, var2) => {
    if (Array.isArray(var1) && Array.isArray(var2)) {
        return [...var1, ...var2];
    } else {
        return {...var1, ...var2};
    }
}

export const normalize = (str: string) => {
  return str.toString().toLowerCase()
    .normalize('NFD')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export const set = (...params: any) => store.set(params[0] as never);
export const get = (param: any) => store.get(param as never);

export const error = (message = getString('error_occurred'), title = 'Error') => {
    dialog.showMessageBox({ title, message });
}

export const getString = (id: string, replaceWith: string[] = []) => {
    let str = strings[id] || '';

    replaceWith.forEach(replacement => {
        str = str.replace('%s', replacement);
    });

    return str;
}

export const noop = () => {};