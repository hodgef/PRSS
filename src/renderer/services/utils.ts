import { remote } from 'electron';

import { store } from '../components/Store';
import strings from '../strings.json';
const { dialog } = remote;

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

export const error = (message = getString('error_occurred'), title = getString('error_occurred_title')) => {
    dialog.showMessageBox({ title, message });
}

export const confirmation = (
    message = getString('confirmation_request_message'),
    title = getString('confirmation_request_title'),
    buttons = ['Yes', 'No', 'Cancel']
) => {
    return new Promise((resolve) => {
        dialog.showMessageBox(
            {
                title,
                message,
                buttons
            },
            resolve
        );
    })
}

export const getString = (id: string, replaceWith: string[] = []) => {
    let str = strings[id] || '';

    replaceWith.forEach(replacement => {
        str = str.replace('%s', replacement);
    });

    return str;
}

export const stringReplace = (str = '', replaceWith = {}) => {
    Object.keys(replaceWith).forEach(key => {
        str = str.replace(`{{${key}}}`, replaceWith[key]);
    });

    return str;
}

export const noop = () => {};

export const sequential = (
    arr: any[][],
    asyncFn: (...p: any) => any,
    timeoutWait = 0,
    updater?: (p: any, r: any) => void,
    index = 0,
    resArr = []
) => {
    if (index >= arr.length) return Promise.resolve(resArr);
    return asyncFn(...arr[index])
      .then(r => {
        const progress = parseInt('' + (((index+1) * 100) / arr.length));
        if (updater) updater(progress, r);

        return new Promise(resolve => {
            const timeout = setTimeout(async () => {
                clearTimeout(timeout);
                const res = await sequential(
                    arr,
                    asyncFn,
                    timeoutWait,
                    updater,
                    index + 1,
                    [...resArr, r]
                );
                resolve(res);
            }, timeoutWait);
        });
      });
};

export const exclude = (obj = {}, keys = []) => {
    const newObj = {...obj};

    keys.forEach(key => {
        delete newObj[key];
    });

    return newObj;
}