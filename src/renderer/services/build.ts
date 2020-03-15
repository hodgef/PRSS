import minify from 'babel-minify';
import del from 'del';
import fse from 'fs-extra';
import path from 'path';

import { get, getString } from '../../common/utils';
import reactHandler from './handlers/react';
import { getPostItem } from './hosting';
import { sanitizeSite, sequential } from './utils';

export const bufferPathFileNames = ['index.html', 'index.js'];
export const configFileName = 'prss.config.js';

export const build = async (siteIdOrSite, onUpdate?) => {
    let site = {} as any;

    if (typeof siteIdOrSite === 'object') {
        site = siteIdOrSite;
    } else if (siteIdOrSite) {
        site = get(`sites.${siteIdOrSite}`);
    } else {
        return false;
    }

    /**
     * Clear Buffer
     */
    await clearBuffer();

    /**
     * Adding config file
     */
    const buildBufferSiteConfigRes = buildBufferSiteConfig(site);

    if (!buildBufferSiteConfigRes) {
        return false;
    }


    /**
     * Buffer items
     */
    const bufferItems = getBufferItems(site);

    /**
     * Load buffer
     */
    const loadBufferRes = await loadBuffer(bufferItems, (progress) => {
        onUpdate && onUpdate(getString('building_progress', [progress]));
    });

    if (!loadBufferRes) {
        return false;
    }

    return true;
}

export const clearBuffer = () => {
    const bufferDir = get('paths.buffer');

    if (bufferDir && bufferDir.includes('buffer')) {
        return del([path.join(bufferDir, '*'), `!${bufferDir}`]);
    } else {
        return Promise.resolve();
    }
};

export const loadBuffer: loadBufferType = (bufferItems, onUpdate = () => {}) => {
    return sequential(bufferItems, buildBufferItem, 300, onUpdate, false);
}

export const buildBufferSiteConfig = (site) => {
    const bufferDir = get('paths.buffer');
    const { code } = minify(`var PRSSConfig = ${JSON.stringify(sanitizeSite(site))}`);

    try {
        fse.outputFileSync(
            path.join(bufferDir, configFileName),
            code
        );
    } catch (e) { return false; }

    return true;
}

export const buildBufferItem = async (item) => {
    let handler: handlerType;
    const { templateId, path: itemPath, parser } = item;

    switch (parser) {
        case 'react':
            handler = reactHandler;
            break;
    
        default:
            handler = async () => ({ html: '', js: ''});
            break;
    }

    const { html, js } = await handler(templateId, item);

    /**
     * Making directory if it does exist 
     */
    const bufferDir = get('paths.buffer');
    const targetDir = path.join(bufferDir, itemPath);

    /**
     * Write HTML
     */
    if (html) {
        try {
            fse.outputFileSync(path.join(targetDir, 'index.html'), html);
        } catch (e) { return false; }
    }

    /**
     * Write JS
     */
    if (js) {
        try {
            fse.outputFileSync(path.join(targetDir, 'index.js'), js);
        } catch (e) { return false; }
    }

    return true;
}

export const getBufferItems = (site): IBufferItem[] => {
    const structurePaths = getStructurePaths(site.structure);
    const bufferItems =
        structurePaths
            .map(item => {
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
                const configPath = (basePostPathArr.length ?
                    basePostPathArr.map(() => '../').join('') : '') + configFileName;

                return post ? {
                    path: '/' + postPath,
                    templateId: `${site.type}.${site.theme}.${post.template}`,
                    parser: post.parser,
                    item: post as IPostItem,
                    configPath
                    // site: sanitizeSite(site) as ISite
                } : null
            });

    return bufferItems;
}

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
}

export const formatStructure = (siteId, nodes, parseItem?) => {
    let outputNodes = nodes;
    const site = get(`sites.${siteId}`);

    const parseNodes = (obj) => {
        const { key, children = [] } = obj;
        const post = getPostItem(site, key);

        if (!post) return obj;

        return {
            key,
            ...(parseItem ? parseItem(post) : {}),
            children: children.map(parseNodes)
        }
    };

    outputNodes = outputNodes.map(node => parseNodes(node));

    return outputNodes;
}