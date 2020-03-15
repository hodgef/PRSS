import { get, getString, set } from '../../common/utils';
import { getStructurePaths } from './build';
import GithubProvider from './providers/github';
import FallbackProvider from './providers/none';
import { error, merge } from './utils';


export const getHostingTypes = () => ({
    github: GithubProvider.hostingTypeDef,
    none: FallbackProvider.hostingTypeDef
});

export const setupRemote = (site: ISite, onUpdate: any) => {
    const { hosting : { name }} = site;

    switch (name) {
        case 'github':
            const githubProvider = new GithubProvider(site);
            return githubProvider.setup(onUpdate);
    
        default:
            const fallbackProvider = new FallbackProvider(site);
            return fallbackProvider.setup(onUpdate);
    }
}

export const deploy = (site: ISite) => {
    const { hosting : { name }} = site;

    switch (name) {
        case 'github':
            const githubProvider = new GithubProvider(site);
            return githubProvider.deploy();
    
        default:
            return Promise.resolve();
    }
}

export const deleteItems = (filesToDeleteArr, site: ISite) => {
    const { hosting : { name }} = site;

    switch (name) {
        case 'github':
            const githubProvider = new GithubProvider(site);
            return githubProvider.deleteFiles(filesToDeleteArr);
    
        default:
            return Promise.resolve();
    }
}

export const setSite = (data: ISite) => {
    const { id: siteId } = data;
    const sites = get('sites');

    set({
        sites: merge(sites, { [siteId]: { id: siteId, ...data } })
    });
}

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

    return postIds.filter((postId) => {
        return structurePaths.some(structurePath => {
            const structurePathArr = structurePath.split('/');
            const postIdIndex = structurePathArr.indexOf(postId);
            return postIdIndex > 0 && postIdIndex !== structurePathArr.length - 1;
        });
    });
}

export const getRootPost = (site) => {
    const { structure } = site;
    const structurePaths = getStructurePaths(structure);
    return structurePaths[0].split('/')[1];
}

export const deletePosts = async (siteId: string, postIds: string[]) => {
    const site = get(`sites.${siteId}`);
    site.items = site.items.filter(item => !postIds.includes(item.id));

    /**
     * Can't delete only post
     */
    if (site.items.length === 1) {
        error(getString('error_delete_single_post'));
        return false;
    }
    
    /**
     * Can't delete root post
     */
    const rootPost = getRootPost(site);

    if (postIds.includes(rootPost)) {
        error(getString('error_delete_root_post'));
        return false;
    }

    /**
     * Warn about deleting posts with children
     */
    const postsWithChildren = checkIfPostsHaveChildren(site, postIds);

    
    console.log('postsWithChildren', postsWithChildren);

    // set(`sites.${siteId}`, site);
    // const { content } = await uploadConfig(siteId) || {};

    // if (content) {
    //     return true;
    // } else {
    //     return false;
    // }
    return false;
}

export const getPostItem = (site, postId) => {
    return site.items.find((siteItem) => {
        return siteItem.id === postId;
    });
}

export const updateSiteStructure = (siteId, newStructure) => {
    const site = get(`sites.${siteId}`);
    if (site) {
        set(`sites.${site.id}.structure`, newStructure);
    }
}