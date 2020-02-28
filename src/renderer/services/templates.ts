import fs from 'fs';
import path from 'path';

import { get, stringReplace } from './utils';

export const getTemplate = (templateName: string, replaceWith) => {
    const templateDir = get('paths.templates');
    const templatePath = path.join(templateDir, `${templateName}.tmpl`);
    const contents = fs.readFileSync(templatePath, 'utf8');

    if (contents) {
        return stringReplace(contents, replaceWith);
    } else {
        return false;
    }
}