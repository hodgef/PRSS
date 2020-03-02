import del from 'del';
import path from 'path';

import reactParser from './parsers/react';
import { get, sequential } from './utils';

export const build = async (siteIdOrSite) => {
    let site = {} as any;

    if (typeof siteIdOrSite === 'object') {
        site = siteIdOrSite;
    } else if (siteIdOrSite) {
        site = get(`sites.${siteIdOrSite}`);
    } else {
        return;
    }

    const { structure } = site as ISite;

    /**
     * Clear Buffer
     */
    await clearBuffer();

    /**
     * Buffer items
     */
    const bufferItems = getBufferItems(structure, site);

    /**
     * Load buffer
     */
    const loadBufferRes = loadBuffer(bufferItems);

    console.log('structure', bufferItems, loadBufferRes);
}

export const clearBuffer = () => {
    const bufferDir = get('paths.buffer');

    if (bufferDir && bufferDir.includes('buffer')) {
        return del([path.join(bufferDir, '*'), `!${bufferDir}`]);
    } else {
        return Promise.resolve();
    }
};

export const loadBuffer: loadBufferType = (bufferItems) => {
    return sequential(bufferItems, buildBufferItem, 1000, (p, r) => console.log(p, r), false);
}

export const buildBufferItem = async (item) => {
    let output: string;
    const { templateId, /*path, */parser } = item;
    // console.log('routePath', templatePath, routePath, parser, item);

    switch (parser) {
        case 'react':
            output = await reactParser(templateId, item);
            break;
    
        default:
            output = '';
            break;
    }

    // console.log('parsedItem', output);

    return output;
}

export const getBufferItems = (structure, site): IBufferItem[] => {
    const structurePaths = getStructurePaths(structure);
    const bufferItems =
        structurePaths
            .map(item => {
                const path = item.split('/');
                let post;

                const mappedPath = path.map(postId => {

                    if (!postId) {
                        return '';
                    }

                    post = site.items.find((siteItem) => {
                        return siteItem.id === postId;
                    });

                    return post.slug;
                })

                return post ? {
                    path: '/' + mappedPath.slice(2).join('/'),
                    templateId: `${site.type}.${site.theme}.${post.template}`,
                    parser: post.parser,
                    item: post as IBaseItem,
                    site: site as ISite
                } : null
            });

    return bufferItems;
}

export const getStructurePaths = (arr, prefix = '', store = []) => {
    if (Array.isArray(arr)) {
        arr.forEach(item => {
            const pathNode = typeof item === 'string' ? item : item[0];
            const curPath = `${prefix}/${pathNode}`;

            store.push(curPath);

            if (item[1]) {
                getStructurePaths(item[1], curPath, store);
            } 
        });
    }
    return store;
}