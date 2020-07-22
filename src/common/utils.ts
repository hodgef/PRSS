import { store } from './bootstrap';
import strings from './strings.json';

/**
 * Store
 */
export const configSet = (...params) =>
    typeof params[0] === 'object'
        ? store.set(params[0])
        : store.set(params[0], params[1]);
export const configGet = (param: any) => store.get(param);
export const configRem = (param: any) => store.delete(param);

export const globalRequire = __non_webpack_require__;

export const getString = (id: string, replaceWith: string[] = []) => {
    let str = strings[id] || '';

    replaceWith.forEach(replacement => {
        str = str.replace('%s', replacement);
    });

    return str;
};

export const toBase64 = file =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

/**
 * Store in localstorage
 */
export const localStorageSet = async (key: string, value: string) => {
    window.localStorage.setItem(key, value);
};

export const localStorageGet = async (key: string) => {
    return window.localStorage.getItem(key);
};

export const localStorageDelete = async (key: string) => {
    window.localStorage.removeItem(key);
};
