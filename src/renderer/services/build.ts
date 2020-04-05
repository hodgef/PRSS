import minify from 'babel-minify';
import del from 'del';
import fse from 'fs-extra';
import fs from 'fs';
import path from 'path';

import { get, getString, getInt } from '../../common/utils';
import reactHandler from './handlers/react';
import { getPostItem } from './hosting';
import { sequential, sanitizeSite, sanitizeItem } from './utils';
import { modal } from '../components/Modal';
import { getThemeManifest } from './theme';

export const bufferPathFileNames = ['index.html', 'index.js'];
export const configFileName = 'config.js';

export const build = async (
    siteIdOrSite,
    onUpdate = (a?) => {},
    itemIdToLoad?,
    skipClear?
) => {
    let site = {} as any;

    if (typeof siteIdOrSite === 'object') {
        site = siteIdOrSite;
    } else if (siteIdOrSite) {
        site = get(`sites.${siteIdOrSite}`);
    } else {
        return false;
    }

    /**
     * Ensure buffer exists
     */
    const bufferDir = getInt('paths.buffer');
    if (!fs.existsSync(bufferDir)) {
        fs.mkdirSync(bufferDir);
    }

    if (!skipClear) {
        /**
         * Clear Buffer
         */
        await clearBuffer();
    }

    /**
     * Adding config file
     */
    const buildBufferSiteConfigRes = buildBufferSiteConfig(site);

    /**
     * Copying anything under static/public
     */
    copyPublicToBuffer();

    if (!buildBufferSiteConfigRes) {
        return false;
    }

    /**
     * Buffer items
     */
    const { itemsToLoad, mainBufferItem, bufferItems } = getFilteredBufferItems(
        site,
        itemIdToLoad
    );

    /**
     * Load buffer
     */
    const loadBufferRes = await loadBuffer(itemsToLoad, progress => {
        onUpdate && onUpdate(getString('building_progress', [progress]));
    });

    console.log('buffer', loadBufferRes);

    if (!loadBufferRes) {
        return false;
    }

    return mainBufferItem ? [mainBufferItem] : bufferItems;
};

export const copyPublicToBuffer = () => {
    const bufferDir = getInt('paths.buffer');
    const publicDir = getInt('paths.public');
    return fse.copy(publicDir, bufferDir);
};

export const getFilteredBufferItems = (site, itemIdToLoad?) => {
    const bufferItems = getBufferItems(site);
    let itemsToLoad = bufferItems;
    let mainBufferItem;

    if (itemIdToLoad) {
        mainBufferItem = bufferItems.find(
            bufferItem => itemIdToLoad === bufferItem.item.id
        );

        const itemSlugsToLoad = mainBufferItem.path
            // left-right trim forward slash
            .replace(/^\/+|\/+$/g, '')
            .split('/');

        const rootPostItemId = site.items[0].id;
        const itemIdsToLoad = [rootPostItemId];

        itemSlugsToLoad.forEach(itemSlug => {
            const foundBufferItem = bufferItems.find(
                bufferItem => bufferItem.item.slug === itemSlug
            );

            if (foundBufferItem) {
                itemIdsToLoad.push(foundBufferItem.item.id);
            }
        });

        itemsToLoad = bufferItems.filter(bufferItem =>
            itemIdsToLoad.includes(bufferItem.item.id)
        );

        console.log(
            'itemIdsToLoad',
            itemIdsToLoad,
            itemsToLoad,
            itemSlugsToLoad
        );
    }

    return {
        mainBufferItem,
        itemsToLoad,
        bufferItems
    };
};

export const clearBuffer = () => {
    return new Promise(async resolve => {
        const bufferDir = getInt('paths.buffer');

        if (bufferDir && bufferDir.includes('buffer')) {
            await del(path.join(bufferDir, '*'));
            await del(path.join(bufferDir, '.git'));
            resolve();
        } else {
            resolve();
        }
    });
};

export const loadBuffer: loadBufferType = (
    bufferItems: IBufferItem[],
    onUpdate = () => {}
) => {
    return sequential(bufferItems, buildBufferItem, 300, onUpdate, false);
};

export const buildBufferSiteConfig = site => {
    const bufferDir = getInt('paths.buffer');
    const { code } = minify(
        `var PRSSConfig = ${JSON.stringify(sanitizeSite(site))}`
    );

    try {
        fse.outputFileSync(path.join(bufferDir, configFileName), code);
    } catch (e) {
        return false;
    }

    return true;
};

export const buildBufferItem = async item => {
    let handler: handlerType;
    const { templateId, path: itemPath, parser } = item;

    switch (parser) {
        case 'react':
            handler = reactHandler;
            break;

        default:
            handler = async () => ({ html: '', js: '' });
            modal.alert(
                `There was an error parsing the template for post id (${item.id})`
            );
            break;
    }

    const { html, js } = await handler(templateId, item);

    /**
     * Making directory if it does exist
     */
    const bufferDir = getInt('paths.buffer');
    const targetDir = path.join(bufferDir, itemPath);

    /**
     * Write HTML
     */
    if (html) {
        try {
            fse.outputFileSync(path.join(targetDir, 'index.html'), html);
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    /**
     * Write JS
     */
    if (js) {
        try {
            fse.outputFileSync(path.join(targetDir, 'index.js'), js);
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    return true;
};

export const getBufferItems = (site): IBufferItem[] => {
    const structurePaths = getStructurePaths(site.structure);
    const themeManifest = getThemeManifest(site.theme);

    if (!themeManifest) {
        modal.alert('Could not find theme manifest.');
        throw 'Could not find theme manifest.';
    }

    const bufferItems = structurePaths.map(item => {
        const path = item.split('/');
        let post;

        const mappedPath = path.map(postId => {
            if (!postId) {
                return '';
            }

            post = getPostItem(site, postId);

            return post.slug;
        });

        const basePostPathArr = mappedPath.slice(2);
        const postPath = basePostPathArr.join('/');
        const configPath =
            (basePostPathArr.length
                ? basePostPathArr.map(() => '../').join('')
                : '') + configFileName;

        return post
            ? ({
                  path: '/' + postPath,
                  templateId: `${site.theme}.${post.template}`,
                  parser: themeManifest.parser,
                  item: sanitizeItem(post) as IPostItem,
                  site, // Will be removed in bufferItem parser
                  configPath
              } as IBufferItem)
            : null;
    });

    return bufferItems;
};

export const getStructurePaths = (nodes, prefix = '', store = []) => {
    nodes.forEach(node => {
        const pathNode = node.key;
        const curPath = `${prefix}/${pathNode}`;

        store.push(curPath);

        if (node.children) {
            getStructurePaths(node.children, curPath, store);
        }
    });

    return store;
};

export const formatStructure = (siteId, nodes, parseItem?) => {
    let outputNodes = nodes;
    const site = get(`sites.${siteId}`);

    const parseNodes = obj => {
        const { key, children = [] } = obj;
        const post = getPostItem(site, key);

        if (!post) return obj;

        return {
            key,
            ...(parseItem ? parseItem(post) : {}),
            children: children.map(parseNodes)
        };
    };

    outputNodes = outputNodes.map(node => parseNodes(node));

    return outputNodes;
};
