import Github from './providers/github';
import { get, merge, set } from './utils';

export const getHostingTypes = () => ({
    github: Github.hostingTypeDef
});

export const setupRemote = (site: ISite, updates: any) => {
    const { hosting : { name }} = site;

    switch (name) {
        case 'github':
            const github = new Github(site);
            return github.setup(updates);
    
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

export const uploadConfig = (siteId: string) => {
    const site = get(`sites.${siteId}`);
    const hostingName = site.hosting.name;

    switch (hostingName) {
        case 'github':
            const github = new Github(site);
            return github.uploadConfig();
    
        default:
            return Promise.resolve();
    }
}