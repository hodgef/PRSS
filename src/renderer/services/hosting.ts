import { get, set } from '../../common/utils';
import GithubProvider from './providers/github';
import FallbackProvider from './providers/none';
import { merge } from './utils';


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