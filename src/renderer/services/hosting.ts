import Github from './providers/github';

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