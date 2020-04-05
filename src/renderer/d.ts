declare module '*.png';
declare module '*.jpg';
declare const __static: string;

/**
 * Interfaces
 */
interface ISite {
    id: string;
    title: string;
    url: string;
    theme: string;
    items: IPostItem[];
    structure: IStructureItem[];
    updatedAt: number | null;
    publishedAt: number | null;
    headHtml: string;
    footerHtml: string;
}

interface IStructureItem {
    key: string;
    children: IStructureItem[];
}

interface IPostItem {
    id: string;
    slug: string;
    title: string;
    template: string;
    content: string;
    headHtml: string;
    footerHtml: string;
    updatedAt: number | null;
    createdAt: number | null;
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
    sites: ISitesInternal;
    paths: IPaths;
}

interface ISiteInternal {
    id: string;
    hosting?: IHosting;
    publishSuggested?: boolean;
}

interface IBufferItem {
    path: string;
    templateId: string;
    parser: string;
    item: IPostItem;
    site: ISite;
    configPath?: string;
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
    data?: object,
    headers?: object
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
) => Promise<handlerTypeReturn>;

type handlerTypeReturn = {
    js?: string;
    html?: string;
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
