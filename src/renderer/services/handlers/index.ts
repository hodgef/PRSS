import { objGet } from '../utils';
import { reactHandler, reactHandlerExtension } from '../handlers/react';

export const parseHtmlParams = (html: string = '', bufferItem: IBufferItem) => {
    let output = html;
    const matches = html.match(/%(.*?)%/g);

    if (matches) {
        matches.forEach((match: string) => {
            const param = match.replace(/%/g, '');
            const value = objGet(param, bufferItem);
            output = output.split(match).join(value);
        });
    }

    return output;
};

export const getParserHandler = parser => {
    let handler: handlerType;

    switch (parser) {
        case 'react':
            handler = reactHandler;
            break;

        default:
            handler = async () => [];
            break;
    }

    return handler;
};

export const getParserTemplateExtension = parser => {
    let extensions: string;

    switch (parser) {
        case 'react':
            extensions = reactHandlerExtension;
            break;

        default:
            extensions = 'js';
            break;
    }

    return extensions;
};
