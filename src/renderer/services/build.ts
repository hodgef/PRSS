import { getParserHandler } from './handlers/index';
import minify from 'babel-minify';
import del from 'del';
import fse from 'fs-extra';
import path from 'path';
import fs from 'fs';

import { getString, configGet } from '../../common/utils';
import {
    sequential,
    sanitizeSite,
    error,
    objGet,
    sanitizeSiteItems,
    toJson,
    appendSlash
} from './utils';
import { modal } from '../components/Modal';
import { getThemeManifest, getDefaultReadme } from './theme';
import { getSite, getItems, getItem } from './db';
import { getRootPost } from './hosting';
import { storeInt } from '../../common/bootstrap';

export const bufferPathFileNames = ['index.html' /*, 'index.js'*/];
export const configFileName = 'config.js';
export const itemsFileName = 'items.js';

export const build = async (
    siteUUID: string,
    onUpdate = (a?) => {},
    itemIdToLoad?,
    skipClear?,
    generateSiteMap = false
) => {
    if (!siteUUID) {
        console.error('No UUID was provided to build()');
        return false;
    }

    if (typeof siteUUID !== 'string') {
        throw new Error('build: siteUUID must be a string');
    }

    if (!skipClear) {
        /**
         * Clear Buffer
         */
        await clearBuffer();
    }

    const { name: siteName, url: siteUrl } = await getSite(siteUUID);

    /**
     * Adding config file
     */
    const buildBufferSiteConfigRes = await buildBufferSiteConfig(siteUUID);

    /**
     * Adding items file
     */
    const buildBufferItemsConfigRes = await buildBufferSiteItemsConfig(
        siteUUID
    );

    /**
     * Copying anything under static/public
     */
    copyPublicToBuffer(siteName);

    if (!buildBufferSiteConfigRes || !buildBufferItemsConfigRes) {
        return false;
    }

    /**
     * Buffer items
     */
    const {
        itemsToLoad,
        mainBufferItem,
        bufferItems
    } = await getFilteredBufferItems(siteUUID, itemIdToLoad);

    /**
     * Load buffer
     */
    const loadBufferRes = await loadBuffer(itemsToLoad, progress => {
        onUpdate && onUpdate(getString('building_progress', [progress]));
    });

    if (!loadBufferRes) {
        return false;
    }

    /**
     * Generate site map
     */
    if (generateSiteMap && siteUrl && !itemIdToLoad) {
        await createSiteMap(bufferItems, siteUrl, onUpdate);
    }

    return mainBufferItem ? [mainBufferItem] : bufferItems;
};

export const createPublicDir = (dirPath: string) => {
    const assetsDir = storeInt.get('paths.assets');
    const publicDir = storeInt.get('paths.public');

    try {
        /**
         * Assets
         */
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir);
        }

        /**
         * Public
         */
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir);
        }

        /**
         * Site Public
         */
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }

        const readmePath = path.join(dirPath, 'README.md');

        if (!fs.existsSync(readmePath)) {
            fse.outputFileSync(
                path.join(dirPath, 'README.md'),
                getDefaultReadme()
            );
        }
    } catch (e) {
        return;
    }
};

export const createSiteMap = async (
    bufferItems: IBufferItem[],
    siteUrl: string,
    onUpdate?
) => {
    const { SitemapStream, streamToPromise } = require('sitemap');
    const bufferDir = storeInt.get('paths.buffer');

    if (onUpdate) {
        onUpdate('Generating Sitemap');
    }

    const stream = new SitemapStream({ hostname: siteUrl });

    bufferItems.forEach(bufferItem => {
        const post = bufferItem.item;
        const postLastUpdated = post.updatedAt || post.createdAt;
        const postPath = appendSlash(bufferItem.path);

        stream.write({
            url: postPath,
            lastmod: new Date(postLastUpdated).toISOString(),
            changefreq: 'daily'
        });
    });

    stream.end();
    const res = (await streamToPromise(stream)).toString();

    try {
        fse.outputFileSync(path.join(bufferDir, 'sitemap.xml'), res);

        /**
         * Creating robots.txt if it doesn't exist
         */
        if (!fs.existsSync(path.join(bufferDir, 'robots.txt'))) {
            fse.outputFileSync(
                path.join(bufferDir, 'robots.txt'),
                `Sitemap: ${appendSlash(siteUrl) + 'sitemap.xml'}\n` +
                    'User-agent:*\n' +
                    'Disallow:\n'
            );
        }

        if (onUpdate) {
            onUpdate('');
        }
    } catch (e) {
        return;
    }
};

export const copyPublicToBuffer = siteName => {
    const bufferDir = storeInt.get('paths.buffer');
    const publicDir = path.join(storeInt.get('paths.public'), siteName);

    if (!fs.existsSync(publicDir)) {
        createPublicDir(publicDir);
    }

    return fse.copy(publicDir, bufferDir);
};

export const getParentIds = (itemUUID: string, nodes: IStructureItem[]) => {
    const parentIds = [];

    const parseNode = node => {
        const nodeChildren = node && node.children ? node.children : [];

        if (node.key === itemUUID) return true;

        if (structureHasItem(itemUUID, nodeChildren)) {
            parentIds.push(node.key);

            if (nodeChildren.length) {
                return nodeChildren.some(parseNode);
            }
        }

        return false;
    };

    nodes.some(parseNode);

    return parentIds;
};

export const getFilteredBufferItems = async (
    siteUUID: string,
    itemIdToLoad?: string
) => {
    const site = await getSite(siteUUID);
    const bufferItems = await getBufferItems(site);
    let itemsToLoad = bufferItems;
    let mainBufferItem;

    if (itemIdToLoad) {
        mainBufferItem = bufferItems.find(
            bufferItem => itemIdToLoad === bufferItem.item.uuid
        );

        /**
         * Get predecessors
         */
        const predecessorIds = getParentIds(itemIdToLoad, site.structure) || [];
        const itemIdsToLoad = [...predecessorIds, itemIdToLoad];

        itemsToLoad = bufferItems.filter(bufferItem =>
            itemIdsToLoad.includes(bufferItem.item.uuid)
        );
    }

    return {
        mainBufferItem,
        itemsToLoad,
        bufferItems
    };
};

export const clearBuffer = (noExceptions = false) => {
    return new Promise(async resolve => {
        const bufferDir = storeInt.get('paths.buffer');

        if (bufferDir && bufferDir.includes('buffer')) {
            if (noExceptions) {
                await del(
                    [path.join(bufferDir, '*'), path.join(bufferDir, '.git')],
                    { force: true }
                );
            } else {
                await del(
                    [
                        path.join(bufferDir, '*'),
                        `!${bufferDir}`,
                        `!${path.join(bufferDir, '.git')}`
                    ],
                    { force: true }
                );
            }
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
    return sequential(bufferItems, buildBufferItem, 0, onUpdate, false);
};

export const buildBufferSiteConfig = async (siteUUID: string) => {
    if (typeof siteUUID !== 'string') {
        throw new Error('buildBufferSiteConfig: siteUUID must be a string');
    }

    const bufferDir = storeInt.get('paths.buffer');
    const site = await getSite(siteUUID);

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

export const buildBufferSiteItemsConfig = async (siteUUID: string) => {
    const bufferDir = storeInt.get('paths.buffer');
    const items = await getItems(siteUUID);
    const { code } = minify(
        `var PRSSItems = ${JSON.stringify(sanitizeSiteItems(items))}`
    );

    try {
        fse.outputFileSync(path.join(bufferDir, itemsFileName), code);
    } catch (e) {
        return false;
    }

    return true;
};

export const buildBufferItem = async (bufferItem: IBufferItem) => {
    const { templateId, path: itemPath, parser } = bufferItem;
    const handler = getParserHandler(parser);

    if (!handler) {
        modal.alert(
            `There was an error parsing the template for post id (${bufferItem.item.uuid})`
        );
        return false;
    }

    const bufferDir = storeInt.get('paths.buffer');
    const itemDir = path.join(bufferDir, itemPath);
    const outputFiles = (await handler(
        templateId,
        bufferItem
    )) as handlerTypeReturn[];

    /**
     * Creating files
     */
    outputFiles.forEach(file => {
        try {
            fse.outputFileSync(
                path.join(itemDir, file.path, file.name),
                file.content
            );
        } catch (e) {
            console.error(e);
            error(e.message);
            return;
        }
    });

    return true;
};

export const getBufferItems = async (
    siteUUIDOrSite
): Promise<IBufferItem[]> => {
    const site =
        typeof siteUUIDOrSite === 'string'
            ? await getSite(siteUUIDOrSite)
            : siteUUIDOrSite;
    const structurePaths = getStructurePaths(site.structure);
    const themeManifest = await getThemeManifest(site.theme);
    const rootPost = getRootPost(site);
    const bufferItems = [];

    if (!themeManifest) {
        modal.alert('Could not find theme manifest.');
        throw 'Could not find theme manifest.';
    }

    const posts = await structureToBufferItems(structurePaths, site.uuid);

    structurePaths.forEach(item => {
        const path = item.split('/');
        let post;

        const mappedPath = path.map(postId => {
            if (!postId) {
                return '';
            }

            post = posts[postId];

            return post.slug;
        });

        /**
         * Parent Ids
         */
        const parentIds = path.slice(
            1,
            bufferItems.indexOf(path[path.length - 1])
        );

        /**
         * Aggregate data
         */
        const vars = {
            ...(site.vars || {}),
            ...(getAggregateItemPropValues(
                'item.vars',
                parentIds,
                bufferItems
            ) || {}),
            ...(post.vars || {})
        };

        const headHtml =
            (site.headHtml || '') +
            (getAggregateItemPropValues(
                'item.headHtml',
                //parentIds,
                [rootPost.uuid],
                bufferItems
            ) || '') +
            (post.headHtml || '');

        const footerHtml =
            (site.footerHtml || '') +
            (getAggregateItemPropValues(
                'item.footerHtml',
                //parentIds,
                [rootPost.uuid],
                bufferItems
            ) || '') +
            (post.footerHtml || '');

        const sidebarHtml =
            (site.sidebarHtml || '') +
            (getAggregateItemPropValues(
                'item.sidebarHtml',
                //parentIds,
                [rootPost.uuid],
                bufferItems
            ) || '') +
            (post.sidebarHtml || '');

        /**
         * Paths
         */
        const basePostPathArr = mappedPath.slice(2); // Relative to root post
        const postPath = basePostPathArr.join('/');
        const rootPath = basePostPathArr.length
            ? basePostPathArr.map(() => '../').join('')
            : '';

        if (post) {
            bufferItems.push({
                path: '/' + postPath,
                templateId: `${site.theme}.${post.template}`,
                parser: themeManifest.parser,
                item: post as IPostItem,
                site: site as ISite, // Will be removed in bufferItem parser, replaced by PRSSConfig
                rootPath,
                headHtml,
                footerHtml,
                sidebarHtml,
                vars
            } as IBufferItem);
        }
    });

    return bufferItems;
};

export const structureToBufferItems = (structurePaths, siteUUID: string) => {
    return new Promise(async resolve => {
        const postIds = [];
        const postPromises = [];

        structurePaths.forEach(item => {
            const path = item.split('/');
            path.forEach(postId => {
                if (!postId) {
                    return;
                }

                postIds.push(postId);
                postPromises.push(getItem(siteUUID, postId));
            });
        });

        const values = await Promise.all(postPromises);
        const output = {};

        postIds.forEach((postId, index) => {
            output[postId] = values[index];
        });

        resolve(output);
    });
};

export const getAggregateItemPropValues = (
    propQuery: string,
    itemsIds: string[],
    bufferItems: IBufferItem[]
) => {
    let aggregate;

    itemsIds.forEach(itemId => {
        const bufferItem = bufferItems.find(
            bItem => bItem.item.uuid === itemId
        );
        const itemPropValue = objGet(propQuery, bufferItem) || '';

        /**
         * Filter excluded vars
         */
        if (
            propQuery === 'item.vars' &&
            Array.isArray(bufferItem.item.exclusiveVars) &&
            bufferItem.item.exclusiveVars.length
        ) {
            bufferItem.item.exclusiveVars.forEach(excludedVar => {
                !!excludedVar && delete itemPropValue[excludedVar];
            });
        }

        if (typeof itemPropValue === 'string') {
            if (!aggregate) aggregate = '';

            aggregate += objGet(propQuery, bufferItem) || '';
        } else if (Array.isArray(itemPropValue)) {
            if (!aggregate) aggregate = [];
            aggregate = [
                ...(aggregate || []),
                ...(objGet(propQuery, bufferItem) || [])
            ];
        } else if (typeof itemPropValue === 'object') {
            if (!aggregate) aggregate = {};
            aggregate = {
                ...(aggregate || {}),
                ...(objGet(propQuery, bufferItem) || {})
            };
        }
    });

    return aggregate;
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

export const walkStructure = async (
    siteUUID: string,
    nodes,
    itemCb?
): Promise<any> => {
    if (!Array.isArray(nodes)) {
        console.error('walkStructure: Nodes must be an array', nodes);
        return false;
    }

    let outputNodes = [...nodes];
    const posts = await getItems(siteUUID);

    const parseNodes = obj => {
        const { key, children = [] } = obj;
        const post = posts.find(p => p.uuid === key && p.siteId === siteUUID);

        if (!post) return obj;

        const parsedNode = {
            key,
            ...(obj.title ? { title: obj.title } : {}),
            ...(itemCb ? itemCb(post, obj) : {}),
            children: children.map(parseNodes)
        };

        return parsedNode;
    };

    outputNodes = outputNodes.map(node => parseNodes(node));

    return outputNodes;
};

export const structureHasItem = (uuid: string, nodes: IStructureItem) => {
    return toJson(nodes).includes(uuid);
};

export const findInStructure = (uuid: string, nodes: IStructureItem[]) => {
    let foundItem;

    const checkNode = node => {
        if (node.key === uuid) {
            foundItem = node;
            return true;
        } else {
            return node.children ? node.children.some(checkNode) : false;
        }
    };

    nodes.some(checkNode);
    return foundItem;
};

export const findInStructureCondition = (
    nodes: IStructureItem[],
    condition
) => {
    let foundItem;

    const checkNode = node => {
        if (condition(node)) {
            foundItem = node;
            return true;
        } else {
            return node.children ? node.children.some(checkNode) : false;
        }
    };

    nodes.some(checkNode);
    return foundItem;
};

export const findParentInStructure = (
    uuid: string,
    nodes: IStructureItem[]
) => {
    let foundItem;

    const checkNode = node => {
        if (node.children && node.children.some(nItem => nItem.key === uuid)) {
            foundItem = node;
            return true;
        } else {
            return node.children ? node.children.some(checkNode) : false;
        }
    };

    nodes.some(checkNode);
    return foundItem;
};

export const insertStructureChildren = (
    structureItemIn: IStructureItem,
    itemToInsert,
    parentPostId: string
) => {
    const structureItem = { ...structureItemIn };
    if (structureItem.key === parentPostId) {
        const newChildren = structureItem.children || [];

        if (Array.isArray(itemToInsert)) {
            newChildren.push(...itemToInsert);
        } else {
            newChildren.push(itemToInsert);
        }

        structureItem.children = newChildren;
    } else {
        structureItem.children = structureItem.children.map(nodeChild =>
            insertStructureChildren(nodeChild, itemToInsert, parentPostId)
        );
    }

    return structureItem;
};
