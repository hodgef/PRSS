declare module '*.png';
declare module '*.jpg';
declare const __static: string;

interface ISite {
    id: string;
    title: string;
    type: string;
    hosting: IHosting;
    url: string;
}

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

interface IHosting extends hostingType {
    name: string;
}

interface ILoading {
    title?: string;
    message?: string;
}

type RequestType = (
    method: any,
    endpoint: string,
    data?: object,
    headers?: object
) => any;

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
