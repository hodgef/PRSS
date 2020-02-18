import { store } from '../components/Store';

export const setSite = (data) => {
    const siteId =  normalize(data.title);
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