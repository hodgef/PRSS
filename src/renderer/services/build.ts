import { getParserHandler } from './handlers/index';
import minify from 'babel-minify';
import del from 'del';
import fse from 'fs-extra';
import path from 'path';

import { get, getString, getInt } from '../../common/utils';
import { getPostItem } from './hosting';
import { sequential, sanitizeSite, sanitizeItem, error, objGet } from './utils';
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
    }

    return {
        mainBufferItem,
        itemsToLoad,
        bufferItems
    };
};

export const clearBuffer = (noExceptions = false) => {
    return new Promise(async resolve => {
        const bufferDir = getInt('paths.buffer');

        if (bufferDir && bufferDir.includes('buffer')) {
            if (noExceptions) {
                await del([
                    path.join(bufferDir, '*'),
                    path.join(bufferDir, '.git')
                ]);
            } else {
                await del([
                    path.join(bufferDir, '*'),
                    `!${bufferDir}`,
                    `!${path.join(bufferDir, '.git')}`
                ]);
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

export const buildBufferItem = async (bufferItem: IBufferItem) => {
    const { templateId, path: itemPath, parser } = bufferItem;
    const handler = getParserHandler(parser);

    if (!handler) {
        modal.alert(
            `There was an error parsing the template for post id (${bufferItem.item.id})`
        );
        return false;
    }

    const bufferDir = getInt('paths.buffer');
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

export const getBufferItems = (site): IBufferItem[] => {
    const structurePaths = getStructurePaths(site.structure);
    const themeManifest = getThemeManifest(site.theme);
    const bufferItems = [];

    if (!themeManifest) {
        modal.alert('Could not find theme manifest.');
        throw 'Could not find theme manifest.';
    }

    structurePaths.forEach(item => {
        const path = item.split('/');
        let post;

        const mappedPath = path.map(postId => {
            if (!postId) {
                return '';
            }

            post = getPostItem(site, postId);

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
                parentIds,
                bufferItems
            ) || '') +
            (post.headHtml || '');

        const footerHtml =
            (site.footerHtml || '') +
            (getAggregateItemPropValues(
                'item.footerHtml',
                parentIds,
                bufferItems
            ) || '') +
            (post.footerHtml || '');

        const sidebarHtml =
            (site.sidebarHtml || '') +
            (getAggregateItemPropValues(
                'item.sidebarHtml',
                parentIds,
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

export const getAggregateItemPropValues = (
    propQuery: string,
    itemsIds: string[],
    bufferItems: IBufferItem[]
) => {
    let aggregate;

    itemsIds.forEach(itemId => {
        const bufferItem = bufferItems.find(bItem => bItem.item.id === itemId);
        const itemPropValue = objGet(propQuery, bufferItem);

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

export const walkStructure = (siteId, nodes, itemCb?) => {
    let outputNodes = [...nodes];
    const site = get(`sites.${siteId}`);

    const parseNodes = obj => {
        const { key, children = [] } = obj;
        const post = getPostItem(site, key);

        if (!post) return obj;

        const parsedNode = {
            key,
            ...(itemCb ? itemCb(post) : {}),
            children: children.map(parseNodes)
        };

        return parsedNode;
    };

    outputNodes = outputNodes.map(node => parseNodes(node));

    return outputNodes;
};

export const findInStructure = (
    siteId: string,
    key: string,
    nodes: IStructureItem
) => {
    let found = false;

    walkStructure(siteId, nodes, item => {
        if (item.id === key) {
            found = true;
        }
    });

    return found;
};
