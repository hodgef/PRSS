import Github from "./providers/github";

export const getHostingTypes = () => ({
    github: Github.hostingTypeDef
});

export const setupRemote = (site: ISite) => {
    const { hosting : { name }} = site;

    switch (name) {
        case 'github':
            const github = new Github(site);
            return github.setup();
    
        default:
            return Promise.resolve();
    }
}