import {
    keychainStore,
    configGet,
    configSet,
    configRem
} from './../../common/utils';
import { getString } from '../../common/utils';
import {
    getStructurePaths,
    findParentInStructure,
    insertStructureChildren
} from './build';
import GithubProvider from './providers/github';
import FallbackProvider from './providers/none';
import { confirmation, error, merge } from './utils';
import { v4 as uuidv4 } from 'uuid';
import {
    deleteSite,
    getSite,
    updateSite,
    getItems,
    deleteItem,
    getSiteUUIDById,
    createItems
} from './db';

export const getHostingTypes = () => ({
    github: GithubProvider.hostingTypeDef,
    none: FallbackProvider.hostingTypeDef
});

export const setupRemote = (siteUUID: string, onUpdate: updaterType) => {
    const {
        hosting: { name: hostingName }
    } = configGet(`sites.${siteUUID}`);

    switch (hostingName) {
        case 'github':
            const githubProvider = new GithubProvider(siteUUID);
            return githubProvider.setup(onUpdate);

        default:
            const fallbackProvider = new FallbackProvider(siteUUID);
            return fallbackProvider.setup(onUpdate);
    }
};

export const deploy = (siteUUID: string, params = []) => {
    const {
        hosting: { name: hostingName }
    } = configGet(`sites.${siteUUID}`);

    switch (hostingName) {
        case 'github':
            const githubProvider = new GithubProvider(siteUUID);
            return githubProvider.deploy(...params);

        default:
            const fallbackProvider = new FallbackProvider(siteUUID);
            return fallbackProvider.deploy(...params);
    }
};

export const getRepositoryUrl = async (siteUUID: string) => {
    const {
        hosting: { name: hostingName }
    } = configGet(`sites.${siteUUID}`);

    switch (hostingName) {
        case 'github':
            const githubProvider = new GithubProvider(siteUUID);
            return githubProvider.getRepositoryUrl();

        default:
            return false;
    }
};

/**
 * Delete all files in remote
 */
export const wipe = (siteUUID: string, onUpdate?) => {
    const {
        hosting: { name: hostingName }
    } = configGet(`sites.${siteUUID}`);

    switch (hostingName) {
        case 'github':
            const githubProvider = new GithubProvider(siteUUID);
            return githubProvider.wipe(onUpdate);

        default:
            return Promise.resolve();
    }
};

export const buildAndDeploy = (
    siteUUID: string,
    onUpdate?: updaterType
    //itemId?: string
) => {
    if (typeof siteUUID !== 'string') {
        throw new Error('buildAndDeploy: siteUUID must be a string');
    }

    return deploy(siteUUID, [onUpdate /*, itemId*/]);
};

export const deleteRemoteItems = (filesToDeleteArr, siteUUID: string) => {
    const {
        hosting: { name: hostingName }
    } = configGet(`sites.${siteUUID}`);

    switch (hostingName) {
        case 'github':
            const githubProvider = new GithubProvider(siteUUID);
            return githubProvider.deleteFiles(filesToDeleteArr);

        default:
            return Promise.resolve();
    }
};

export const setSiteConfig = (data: ISiteInternal) => {
    const { uuid } = data;
    const sites = configGet('sites');

    return configSet({
        sites: merge(sites, { [uuid]: { uuid: uuid, ...data } })
    });
};

export const checkIfPostsHaveChildren = (site, postIds = []) => {
    const { structure } = site;
    const structurePaths = getStructurePaths(structure);

    return postIds.filter(postId => {
        return structurePaths.some(structurePath => {
            const structurePathArr = structurePath.split('/');
            const postIdIndex = structurePathArr.indexOf(postId);
            return (
                postIdIndex > 0 && postIdIndex !== structurePathArr.length - 1
            );
        });
    });
};

export const getRootPost = site => {
    const { structure } = site;
    const structurePaths = getStructurePaths(structure);
    return structurePaths[0].split('/')[1];
};

export const deleteSites = async (siteIds: string[]) => {
    const confRes = await confirmation({
        title: getString('warn_delete_sites')
    });

    const delSite = async siteId => {
        const siteUUID = await getSiteUUIDById(siteId);
        await deleteSite(siteUUID);
        await configRem(`sites.${siteUUID}`);
    };

    if (confRes !== 0) {
        return false;
    }

    const delPromises = [];

    siteIds.forEach((siteIdToDelete: string) => {
        delPromises.push(delSite(siteIdToDelete));
    });

    await Promise.all(delPromises);
    return true;
};

export const deleteMenus = async (siteUUID: string, menuNames: string[]) => {
    const site = await getSite(siteUUID);
    const updatedAt = Date.now();

    const confRes = await confirmation({
        title: getString('warn_delete_menus')
    });

    if (confRes !== 0) {
        return false;
    }

    const updatedMenus = { ...site.menus };

    menuNames.forEach(menuToDelete => {
        if (['header', 'sidebar', 'footer'].includes(menuToDelete)) {
            return;
        }

        delete updatedMenus[menuToDelete];
    });

    /**
     * Update site updatedAt
     */
    await updateSite(siteUUID, {
        menus: updatedMenus,
        updatedAt
    });

    return updatedMenus;
};

export const deletePosts = async (siteUUID: string, postIds: string[]) => {
    const site = await getSite(siteUUID);
    const items = await getItems(siteUUID);

    /**
     * Can't delete only post
     */
    if (items.length === 1) {
        error(getString('error_delete_single_post'));
        return {};
    }

    /**
     * Can't delete root post
     */
    const rootPost = getRootPost(site);

    if (postIds.includes(rootPost)) {
        error(getString('error_delete_root_post'));
        return {};
    }

    /**
     * Warn about deleting posts with children
     */
    const postsWithChildren = checkIfPostsHaveChildren(site, postIds);

    const confRes = await confirmation({
        title: getString(
            postsWithChildren.length
                ? 'warn_delete_post_with_children'
                : 'confirmation_request_message'
        )
    });

    if (confRes !== 0) {
        return {};
    }

    /**
     * Filter out deleted items from item list
     */
    const filteredItems = items.filter(item => !postIds.includes(item.uuid));

    /**
     * Filter out deleted items from site structure
     */
    const filteredStructure = await filterItemsFromNodes(
        siteUUID,
        site.structure,
        postIds
    );

    /**
     * Filter out deleted items from menus
     */
    const siteMenus = site.menus || {};
    const filteredMenuPromises = [];

    Object.keys(siteMenus).forEach(menuName => {
        filteredMenuPromises.push(
            filterItemsFromNodes(siteUUID, siteMenus[menuName], postIds)
        );
    });

    const filteredMenuValues = await Promise.all(filteredMenuPromises);
    const filteredMenus = {};

    Object.keys(siteMenus).forEach((menuName, index) => {
        filteredMenus[menuName] = filteredMenuValues[index];
    });

    /**
     * Saving changes
     */
    await updateSite(siteUUID, {
        structure: filteredStructure,
        menus: filteredMenus,
        updatedAt: Date.now()
    });
    await Promise.all(postIds.map(postId => deleteItem(siteUUID, postId)));

    return {
        structure: filteredStructure,
        items: filteredItems
    };
};

export const clonePosts = async (siteUUID: string, postIds: string[]) => {
    const site = await getSite(siteUUID);
    const { structure } = site;
    const items = await getItems(siteUUID);

    /**
     * Can't clone root post
     */
    const rootPost = getRootPost(site);

    if (postIds.includes(rootPost)) {
        error(
            'You cannot clone the root post. Please unselect it and try again.'
        );
        return {};
    }

    /**
     * Warn about deleting posts with children
     */
    const confRes = await confirmation({
        title: `Are you sure you want to clone ${
            postIds.length > 1 ? 'these' : 'this'
        } ${postIds.length} ${postIds.length > 1 ? 'posts' : 'post'}?`
    });

    if (confRes !== 0) {
        return {};
    }

    const newItems = [];
    let updatedStructure = [...structure];

    postIds.forEach(postId => {
        const postToBeCloned = items.find(item => item.uuid === postId);
        const nodeParent = findParentInStructure(postId, structure);
        const cloneId = uuidv4();
        const randomString = cloneId.substring(0, 5);
        const cloneItem = {
            ...postToBeCloned,
            uuid: cloneId,
            createdAt: Date.now(),
            updatedAt: null,
            title: '[CLONE] ' + postToBeCloned.title,
            slug: postToBeCloned.slug + `-${randomString}`
        };
        delete cloneItem.id;
        const cloneStructureItem = {
            key: cloneId,
            children: []
        };

        updatedStructure = updatedStructure.map(node =>
            insertStructureChildren(node, cloneStructureItem, nodeParent.key)
        );
        newItems.push(cloneItem);
    });

    const updatedItems = [...items, ...newItems];

    /**
     * Update structure
     */
    await updateSite(siteUUID, {
        structure: updatedStructure,
        updatedAt: Date.now()
    });

    /**
     * Add items
     */
    await createItems(newItems);
    return { updatedStructure, updatedItems };
};

export const deleteMenuEntries = async (
    siteUUID: string,
    menuId: string,
    postIds: string[]
) => {
    const updatedAt = Date.now();
    const { menus } = await getSite(siteUUID);
    const menu = menus[menuId];

    /**
     * Filter out deleted items from site structure
     */
    const filteredStructure = await filterItemsFromNodes(
        siteUUID,
        menu,
        postIds
    );

    /**
     * Saving changes
     */
    const updatedMenus = {
        ...menus,
        [menuId]: filteredStructure
    };

    await updateSite(siteUUID, {
        menus: updatedMenus,
        updatedAt
    });

    await configSet(`sites.${siteUUID}.publishSuggested`, true);
    return filteredStructure;
};

export const updateSiteStructure = async (siteUUID: string, newStructure) => {
    const site = await getSite(siteUUID);

    if (site) {
        await updateSite(siteUUID, {
            structure: newStructure,
            updatedAt: Date.now()
        });

        await configSet(`sites.${site.uuid}.publishSuggested`, true);
    }
};

export const filterItemsFromNodes = async (
    siteUUID: string,
    nodes,
    itemIds = []
): Promise<IStructureItem[]> => {
    let outputNodes = nodes;
    const posts = await getItems(siteUUID);

    const parseNodes = obj => {
        const { key, children = [] } = obj;
        const post = posts.find(p => p.uuid === key && p.siteId === siteUUID);

        if (!post) return obj;
        if (itemIds.includes(key)) {
            return null;
        }

        return {
            ...obj,
            key,
            children: children
                .filter(node => !itemIds.includes(node.key))
                .map(parseNodes)
                .filter(resNode => !!resNode)
        };
    };

    outputNodes = outputNodes
        .map(node => parseNodes(node))
        .filter(resNode => !!resNode);

    return outputNodes;
};

export const handleHostingFields = (hostingFieldsObj = {}) => {
    return new Promise(resolve => {
        const fields = { ...hostingFieldsObj };
        const { name, username } = fields as IHosting;

        if (!name || !username) {
            resolve({});
        }

        const storePromises = [];
        ['password', 'token'].forEach(sensitiveField => {
            if (fields[sensitiveField]) {
                storePromises.push(
                    keychainStore(name, username, fields[sensitiveField])
                );
            }
            fields[sensitiveField] = null;
            delete fields[sensitiveField];
        });

        Promise.all(storePromises).finally(() => resolve(fields));
    });
};

export const validateHostingFields = (
    hostingFieldsObj: object,
    hostingFields: any[]
) => {
    const fields = [...hostingFields];

    return fields.every(field => {
        if (field.optional) {
            return true;
        } else {
            return !!hostingFieldsObj[field.name];
        }
    });
};

export const isValidSlug = async (
    slug: string,
    siteUUID: string,
    postId?: string
) => {
    const site = await getSite(siteUUID);
    const nodeParent = findParentInStructure(postId, site.structure);

    /**
     * Check if parent's children have same slug
     */
    const mappedChildren = await mapNodesToItems(siteUUID, nodeParent.children);

    return !mappedChildren.some(
        item => slug === item.slug && item.uuid !== postId
    );
};

export const mapNodesToItems = async (siteUUID, nodes) => {
    const items = await getItems(siteUUID);

    return (nodes || []).map(node =>
        items.find(item => item.uuid === node.key)
    );
};

export const siteVarToArray = (siteVars: ISiteVar) => {
    return Object.keys(siteVars).map(varName => {
        return {
            name: varName,
            content: siteVars[varName]
        };
    });
};
