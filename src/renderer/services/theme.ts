import fs from 'fs';
import path from 'path';

import { getInt } from '../../common/utils';
import { modal } from '../components/Modal';
import { getFilePaths, getDirPaths } from './files';

export const getTemplate = async (templateId: string, extension: string) => {
    const templateRelPath = templateId.split('.').join('/');
    const templatePathName = `${templateRelPath}.${extension}`;

    const templatePath = path.join(getInt('paths.themes'), templatePathName);

    return fs.readFileSync(templatePath, 'utf8');
};

export const getThemeList = themeType => {
    const themeDir = path.join(getInt('paths.themes'), themeType);
    const templateList = getDirPaths(themeDir).map(filePath =>
        path.basename(filePath)
    );
    return templateList;
};

export const getTemplateList = (themeType, themeName) => {
    const themeDir = path.join(getInt('paths.themes'), themeType, themeName);
    const templateList = getFilePaths(themeDir)
        .map(filePath => path.basename(filePath, path.extname(filePath)))
        .filter(templateName => !['manifest'].includes(templateName));
    return templateList;
};

export const getThemeManifest = (type: string, theme: string) => {
    if (!type || !theme) {
        return false;
    }

    const manifestPath = path.join(
        getInt('paths.themes'),
        type,
        theme,
        'manifest.json'
    );

    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
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
