declare module '*.png';
declare module '*.jpg';
declare const __static: string;

/**
 * Interfaces
 */
interface ISite {
    id: string;
    title: string;
    type: string;
    hosting?: IHosting;
    url: string;
    theme: string;
    items: IBaseItem[];
    structure: any[];
}

interface IBaseItem {
    id: string;
    slug: string;
    title: string;
    content: string;
    parser: string;
}

interface IBlogItem extends IBaseItem {}

interface ISites {
    [name: string]: ISite; 
}

interface IPaths {
    [name: string]: string;
}

interface IStore {
    sites: ISites;
    paths: IPaths;
}

interface IBufferItem {
    path: string;
    templateId: string;
    parser: string;
    item: IBlogItem;
    site: ISite;
}

interface IHosting extends hostingType {
    name: string;
}

interface ILoading {
    title?: string;
    message?: string;
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

type loadBufferType = (
    bufferItems: IBufferItem[]
) => any;

type parserType = (
    templateId?: string,
    data?: any
) => Promise<string>;

type hostingGithubType = {
    token?: string;
    username?: string;
};

type getThemeFilesType = (
    type: string,
    theme: string,
) => any;

type hostingType = hostingGithubType;
type noop = () => void;
