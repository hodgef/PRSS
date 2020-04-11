import fs from 'fs';
import { getString, getInt } from '../../common/utils';
import { modal } from '../components/Modal';

export const merge = (var1, var2) => {
    if (Array.isArray(var1) && Array.isArray(var2)) {
        return [...var1, ...var2];
    } else {
        return { ...var1, ...var2 };
    }
};

export const normalizeStrict = (str: string) => {
    return str
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

export const normalize = (str: string) => {
    return str
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\s+/g, '-')
        .replace(/[^\w!.\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/\.\.+/g, '.')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

export const camelCase = (str: string) => {
    return str
        .toString()
        .replace(/[^\w]+/g, '')
        .normalize('NFD')
        .replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        })
        .replace(/\s+/g, '');
};

export const alert = (message: string, title?: string) => {
    modal.alert(message, title);
};

export const error = (
    message = getString('error_occurred'),
    title?: string
) => {
    alert(message, title);
    // dialog.showMessageBox({ title, message });
};

export const confirmation = ({
    title,
    buttons = [{ label: 'Yes', action: () => {} }],
    showCancel = true
}) => {
    return new Promise(resolve => {
        const mappedButtons = buttons.map(
            ({ label, action = () => {} }, index) => {
                return {
                    label,
                    action: () => {
                        action();
                        resolve(index);
                        modal.close();
                    }
                };
            }
        );

        modal.confirm({
            title,
            buttons: mappedButtons,
            showCancel,
            onCancel: () => {
                resolve(-1);
            }
        });
    });
};

export const stringReplace = (str = '', replaceWith = {}) => {
    Object.keys(replaceWith).forEach(key => {
        str = str.replace(`{{${key}}}`, replaceWith[key]);
    });

    return str;
};

export const checkDirs = async () => {
    /**
     * Ensure buffer exists
     */
    const bufferDir = getInt('paths.buffer');
    if (!fs.existsSync(bufferDir)) {
        fs.mkdirSync(bufferDir);
    }
};

export const noop = () => {};

export const sequential = (
    arr: any[],
    asyncFn: (...p: any) => any,
    timeoutWait = 0,
    onUpdate?: (p: any, r: any) => void,
    spreadItems = true,
    index = 0,
    resArr = []
) => {
    if (index >= arr.length) return Promise.resolve(resArr);
    const asyncFnPromise = spreadItems
        ? asyncFn(...arr[index])
        : asyncFn(arr[index]);
    if (!isPromise(asyncFnPromise))
        throw new Error('asyncFn must be a promise!');

    return asyncFnPromise.then(r => {
        const progress = parseInt('' + ((index + 1) * 100) / arr.length);
        if (onUpdate) onUpdate(progress, r);

        return new Promise(resolve => {
            const timeout = setTimeout(async () => {
                clearTimeout(timeout);
                const res = await sequential(
                    arr,
                    asyncFn,
                    timeoutWait,
                    onUpdate,
                    spreadItems,
                    index + 1,
                    [...resArr, r]
                );
                resolve(res);
            }, timeoutWait);
        });
    });
};

export const exclude = (obj = {}, keys = []) => {
    const newObj = { ...obj };

    keys.forEach(key => {
        delete newObj[key];
    });

    return newObj;
};

export const objGet = (s, obj) =>
    s.split('.').reduce((a, b) => (a ? a[b] : ''), obj);

export const isPromise = value =>
    Boolean(value && typeof value.then === 'function');

export const sanitizeSite = siteObj => {
    const newObj = JSON.parse(JSON.stringify(siteObj));

    /**
     * Remove site keys
     */
    ['headHtml', 'footerHtml', 'vars'].forEach(field => {
        delete newObj[field];
    });

    /**
     * Update items
     */
    newObj.items = newObj.items.map(item => {
        item.content = truncateString(stripTags(item.content));
        return sanitizeItem(item);
    });

    return newObj;
};

export const sanitizeItem = itemObj => {
    const newObj = JSON.parse(JSON.stringify(itemObj));
    ['headHtml', 'footerHtml', 'vars'].forEach(field => {
        delete newObj[field];
    });
    return newObj;
};

export const sanitizeBufferItem = itemObj => {
    const newObj = JSON.parse(JSON.stringify(itemObj));
    delete newObj.site;
    return newObj;
};

export const truncateString = (string, maxLength = 50) => {
    if (!string) return null;
    if (string.length <= maxLength) return string;
    return `${string.substring(0, maxLength)}...`;
};

export const stripTags = html => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
};

export const isHtml = RegExp.prototype.test.bind(/(<([^>]+)>)/i);
