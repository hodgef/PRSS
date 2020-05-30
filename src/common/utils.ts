import path from 'path';
import fs from 'fs';

import { store } from './Store';
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
 * Securely any secrets in the OS keychain
 */
export const keychainStore = (
    service: string,
    username: string,
    password: string
) => {
    const keytar = globalRequire('keytar');
    return keytar.setPassword(service, username, password);
};

export const keychainRetreive = (service: string, username: string) => {
    const keytar = globalRequire('keytar');
    return keytar.getPassword(service, username);
};

export const keychainRemove = (service: string, username: string) => {
    const keytar = globalRequire('keytar');
    return keytar.deletePassword(service, username);
};
