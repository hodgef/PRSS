declare module '*.png';
declare module '*.jpg'

interface ISite {
    id: string;
    title: string;
    type: string;
    hosting: IHosting;
}

interface IHosting extends hostingType {
    name: string;
}

interface ILoading {
    title?: string;
    message?: string;
}

type IRequest = (
    method: any,
    endpoint: string,
    data?: object
) => any;

type hostingGithubType = {
    token?: string;
    username?: string;
};

type hostingType = hostingGithubType;
type noop = () => void;