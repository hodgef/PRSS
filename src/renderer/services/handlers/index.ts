import { objGet } from '../utils';
import { reactHandler, reactHandlerExtension } from '../handlers/react';

export const parseHtmlParams = (html: string = '', bufferItem: IBufferItem) => {
    let output = html;

    const matches = output.match(/%[0-9a-zA-Z\.]+%/g);

    if (matches) {
        matches.forEach((match: string) => {
            const param = match.replace(/%/g, '');
            const value = objGet(param, bufferItem) || '';

            //if (typeof value !== 'undefined') {
            output = output.split(match).join(value);
            //}
        });
    }

    const matchesEscaped = output.match(/\\%[0-9a-zA-Z\.]+\\%/g);

    if (matchesEscaped) {
        matchesEscaped.forEach((match: string) => {
            const param = match.replace(/\\%/g, '%');
            output = output.split(match).join(param);
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
