import { store } from '../components/Store';
import { remote } from 'electron';
const { dialog } = remote;

export const setSite = (data: ISite) => {
    const { id: siteId } = data;
    const sites = get('sites');

    set({
        sites: merge(sites, { [siteId]: { id: siteId, ...data }  })
    });
}

export const merge = (var1, var2) => {
    if(Array.isArray(var1) && Array.isArray(var2)){
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

export const error = (message = "An error has occurred. Please try again later.", title = "Error") => {
    dialog.showMessageBox({ title, message });
}