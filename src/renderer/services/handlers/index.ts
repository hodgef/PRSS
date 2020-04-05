import { objGet } from '../utils';

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
