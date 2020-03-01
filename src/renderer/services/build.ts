import { get } from './utils';

export const build = (siteIdOrSite) => {
    let site = {} as any;

    if (typeof siteIdOrSite === 'object') {
        site = siteIdOrSite;
    } else if (siteIdOrSite) {
        site = get(`sites.${siteIdOrSite}`);
    } else {
        return;
    }

    const { structure } = site as ISite;
    const structurePaths = getBufferItems(structure, site);

    console.log('structure', structurePaths);
}

export const getBufferItems = (structure, site) => {
    const structurePaths = getStructurePaths(structure);
    const bufferPaths =
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
                    ...post,
                    path: '/' + mappedPath.slice(2).join('/')
                } : null
            });

    return bufferPaths;
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