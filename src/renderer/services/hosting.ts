import { keychainStore, getInt, setInt, remInt } from './../../common/utils';
import { get, getString, rem, set } from '../../common/utils';
import { getStructurePaths } from './build';
import GithubProvider from './providers/github';
import FallbackProvider from './providers/none';
import { confirmation, error, merge } from './utils';

export const getHostingTypes = () => ({
    github: GithubProvider.hostingTypeDef,
    none: FallbackProvider.hostingTypeDef
});

export const setupRemote = (site: ISite, onUpdate: updaterType) => {
    const {
        hosting: { name }
    } = getInt(`sites.${site.id}`);

    switch (name) {
        case 'github':
            const githubProvider = new GithubProvider(site);
            return githubProvider.setup(onUpdate);

        default:
            const fallbackProvider = new FallbackProvider(site);
            return fallbackProvider.setup(onUpdate);
    }
};

export const deploy = (site: ISite, params = []) => {
    const {
        hosting: { name }
    } = getInt(`sites.${site.id}`);

    switch (name) {
        case 'github':
            const githubProvider = new GithubProvider(site);
            return githubProvider.deploy(...params);

        default:
            const fallbackProvider = new FallbackProvider(site);
            return fallbackProvider.deploy(...params);
    }
};

export const getRepositoryUrl = (site: ISite) => {
    const {
        hosting: { name }
    } = getInt(`sites.${site.id}`);

    switch (name) {
        case 'github':
            const githubProvider = new GithubProvider(site);
            return githubProvider.getRepositoryUrl();

        default:
            return false;
    }
};

/**
 * Delete all files in remote
 */
export const wipe = (site: ISite, onUpdate?) => {
    const {
        hosting: { name }
    } = getInt(`sites.${site.id}`);

    switch (name) {
        case 'github':
            const githubProvider = new GithubProvider(site);
            return githubProvider.wipe(onUpdate);

        default:
            return Promise.resolve();
    }
};

export const buildAndDeploy = (
    site: ISite,
    onUpdate?: updaterType,
    itemId?: string
) => {
    return deploy(site, [onUpdate, itemId]);
};

export const deleteRemoteItems = (filesToDeleteArr, site: ISite) => {
    const {
        hosting: { name }
    } = getInt(`sites.${site.id}`);

    switch (name) {
        case 'github':
            const githubProvider = new GithubProvider(site);
            return githubProvider.deleteFiles(filesToDeleteArr);

        default:
            return Promise.resolve();
    }
};

export const setSite = (data: ISite) => {
    const { id: siteId } = data;
    const sites = get('sites');

    return set({
        sites: merge(sites, { [siteId]: { id: siteId, ...data } })
    });
};

export const setSiteInternal = async (data: ISiteInternal) => {
    const { id: siteId } = data;
    const sites = await getInt('sites');

    return setInt({
        sites: merge(sites, { [siteId]: { id: siteId, ...data } })
    });
};

// export const uploadConfig = (siteId: string) => {
//     const site = get(`sites.${siteId}`);
//     const hostingName = site.hosting.name;

//     switch (hostingName) {
//         case 'github':
//             const githubProvider = new GithubProvider(site);
//             return githubProvider.uploadConfig();

//         default:
//             return Promise.resolve();
//     }
// }

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

    if (confRes !== 0) {
        return false;
    }

    const delPromises = [];

    siteIds.forEach(siteIdToDelete => {
        delPromises.push(
            rem(`sites.${siteIdToDelete}`),
            remInt(`sites.${siteIdToDelete}`)
        );
    });

    await Promise.all(delPromises);
    return true;
};

export const deletePosts = async (siteId: string, postIds: string[]) => {
    const site = get(`sites.${siteId}`);

    /**
     * Can't delete only post
     */
    if (site.items.length === 1) {
        error(getString('error_delete_single_post'));
        return;
    }

    /**
     * Can't delete root post
     */
    const rootPost = getRootPost(site);

    if (postIds.includes(rootPost)) {
        error(getString('error_delete_root_post'));
        return;
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
        return;
    }

    /**
     * Filter out deleted items from item list
     */
    const filteredItems = site.items.filter(item => !postIds.includes(item.id));

    /**
     * Filter out deleted items from site structure
     */
    const filteredStructure = filterItemsFromNodes(
        siteId,
        site.structure,
        postIds
    );

    /**
     * Saving changes
     */
    site.items = filteredItems;
    site.structure = filteredStructure;
    site.updatedAt = Date.now();

    set(`sites.${siteId}`, site);

    return site;
};

export const getPostItem = (site, postId) => {
    return site.items.find(siteItem => {
        return siteItem.id === postId;
    });
};

export const updateSiteStructure = (siteId, newStructure) => {
    const site = get(`sites.${siteId}`);
    if (site) {
        set(`sites.${site.id}.structure`, newStructure);
        set(`sites.${site.id}.updatedAt`, Date.now());
        setInt(`sites.${site.id}.publishSuggested`, true);
    }
};

export const filterItemsFromNodes = (siteId, nodes, itemIds = []) => {
    let outputNodes = nodes;
    const site = get(`sites.${siteId}`);

    const parseNodes = obj => {
        const { key, children = [] } = obj;
        const post = getPostItem(site, key);

        if (!post) return obj;

        return {
            key,
            children: children
                .filter(node => !itemIds.includes(node.key))
                .map(parseNodes)
        };
    };

    outputNodes = outputNodes.map(node => parseNodes(node));

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

export const isValidSlug = (slug: string, siteId: string, postId?: string) => {
    const site = get(`sites.${siteId}`);
    return !site.items.some(item => slug === item.slug && item.id !== postId);
};

export const siteVarToArray = (siteVars: ISiteVar) => {
    return Object.keys(siteVars).map(varName => {
        return {
            name: varName,
            content: siteVars[varName]
        };
    });
};
