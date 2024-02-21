declare module '*.png';
declare module '*.jpg';
declare const __static: string;

/**
 * Interfaces
 */
interface ISite {
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

interface ISiteVar {
    [key: string]: string;
}

interface ISiteMenus {
    [name: string]: IStructureItem[];
}

interface IStructureItem {
    key: string;
    children: IStructureItem[];
    title?: any;
}

interface IPostItem {
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

interface ITemplateComponent {
    props: IBufferItem;
}

interface ISites {
    [name: string]: ISite; 
}

interface IPaths {
    [name: string]: string;
}

interface IStore {
    sites: ISites;
}

interface ISitesInternal {
    [name: string]: ISiteInternal; 
}

interface IStoreInternal {
    paths: IPaths;
}

interface ISiteInternal {
    uuid: string;
    name?: string;
    hosting?: IHosting;
    publishSuggested?: boolean;
}

interface IBufferItem {
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

interface IHosting extends hostingType {
    name: string;
}

/**
 * Types
 */
type requestType = (
    method: any,
    endpoint: string,
    data?: any,
    headers?: any
) => any;

type updaterType = (
    p: string,
    ref?: any
) => any;

type loadBufferType = (
    bufferItems: IBufferItem[],
    onUpdate?: updaterType
) => any;

type handlerType = (
    templateId?: string,
    data?: any
) => Promise<handlerTypeReturn[]>;

type handlerTypeReturn = {
    name: string;
    content: string;
    path: string;
};

type hostingGithubType = {
    username?: string;
    repository?: string;
};

type getThemeFilesType = (
    theme: string,
) => any;

type hostingType = hostingGithubType;
type noop = () => void;
