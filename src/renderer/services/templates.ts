import fs from 'fs';
import path from 'path';

import { get } from '../../common/utils';

export const getTemplate = async (templateId: string, extension: string) => {
    const templateRelPath = templateId.split('.').join('/');
    const templatePathName = `${templateRelPath}.${extension}`;

    const templatePath = path.join(get('paths.themes'), templatePathName);

    return fs.readFileSync(templatePath, 'utf8');
};

export const baseTemplate = ({ head = '', body = '' }: any) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          ${head}
        </head>
        
        <body>
          ${body}
        </body>
      </html>
    `;
};
