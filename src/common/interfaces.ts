/**
 * Interfaces
 */
export interface ISite {
    uuid: string;
    name: string;
    title: string;
    url: string;
    theme: string;
    items: IPostItem[];
    structure: IStructureItem[];
    updatedAt: number | null;
    createdAt: number | null;
    publishedAt: number | null;
    headHtml: string;
    footerHtml: string;
    sidebarHtml: string;
    vars: ISiteVar;
    menus: ISiteMenus;
}

export type IManifestSiteVarsType = "string" | "image" | "url";

export interface IThemeManifest {
    name: string;
    title: string;
    version: string;
    author: string;
    homepage: string;
    license: string;
    type: string;
    parser: string;
    templates: string[];
    siteVars: { type: IManifestSiteVarsType, description: string }[];
    isLocal?: boolean;
}

export interface IConfigThemes {
    [key: string]: string;
}

export interface IConfigAddons {
    id: string;
    display_name: string;
    short_description: string;
    title: string;
    description: string;
    min_version: string;
    icon: string;
}

export interface IConfig {
    version: string;
    latest: string;
    themes: IConfigThemes;
    subscribed_addons: string[];
    available_addons: IConfigAddons[];
}

export interface ISiteVar {
    [key: string]: string;
}

export interface ISiteMenus {
    [name: string]: IStructureItem[];
}

export interface IStructureItem {
    key: string;
    children: IStructureItem[];
    title?: any;
}

export interface IPostItem {
    uuid: string;
    siteId: string;
    slug: string;
    title: string;
    template: string;
    content: string;
    isContentRaw?: boolean;
    headHtml?: string;
    footerHtml?: string;
    sidebarHtml?: string;
    updatedAt: number | null;
    createdAt: number | null;
    vars: ISiteVar;
    exclusiveVars?: string[];
}

export interface ITemplateComponent {
    props: IBufferItem;
}

export interface ISites {
    [name: string]: ISite;
}

export interface IPaths {
    [name: string]: string;
}

export interface IStore {
    sites: ISites;
}

export interface ISitesInternal {
    [name: string]: ISiteInternal;
}

export interface IStoreInternal {
    paths: IPaths;
}

export interface ISiteInternal {
    uuid: string;
    name?: string;
    hosting?: IHosting;
    publishSuggested?: boolean;
}

export interface IBufferItem {
    path: string;
    templateId: string;
    parser: string;
    item: IPostItem;
    site: ISite;
    rootPath?: string;
    headHtml?: string;
    footerHtml?: string;
    sidebarHtml?: string;
    vars?: ISiteVar;
}

export interface IHosting extends hostingType {
    name: string;
    token?: string;
}

/**
 * Types
 */
export type requestType = (
    method: any,
    endpoint: string,
    data?: any,
    headers?: any
) => any;

export type updaterType = (
    p: string,
    ref?: any
) => any;

export type loadBufferType = (
    bufferItems: IBufferItem[],
    onUpdate?: updaterType
) => any;

export type handlerType = (
    templateId?: string,
    data?: any
) => Promise<handlerTypeReturn[]>;

export type handlerTypeReturn = {
    name: string;
    content: string;
    path: string;
};

export type hostingGithubType = {
    username?: string;
    repository?: string;
};

export type getThemeFilesType = (
    theme: string,
) => any;

export type hostingType = hostingGithubType;
export type Noop = () => void;
