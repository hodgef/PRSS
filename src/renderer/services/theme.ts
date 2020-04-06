import fs from 'fs';
import path from 'path';

import { getInt } from '../../common/utils';
import { getFilePaths, getDirPaths } from './files';
import { getParserTemplateExtension } from './handlers';

export const getTemplate = async (templateId: string, extension: string) => {
    const templateRelPath = templateId.split('.').join('/');
    const templatePathName = `${templateRelPath}.${extension}`;

    const templatePath = path.join(getInt('paths.themes'), templatePathName);

    return fs.readFileSync(templatePath, 'utf8');
};

export const getThemeListDetails = () => {
    const themeNameList = getThemeList();

    return themeNameList.map(themeName => {
        const themeDir = path.join(getInt('paths.themes'), themeName);
        return {
            ...(getThemeManifest(themeName) || {}),
            name: themeName,
            themeDir: themeDir
        };
    });
};

export const getThemeList = () => {
    const themeDir = path.join(getInt('paths.themes'));
    const templateList = getDirPaths(themeDir).map(filePath =>
        path.basename(filePath)
    );
    return templateList;
};

export const getTemplateList = themeName => {
    const themeDir = path.join(getInt('paths.themes'), themeName);
    const themeManifest = getThemeManifest(themeName) || {};
    const templateExtension = getParserTemplateExtension(themeManifest.parser);

    const templateList = getFilePaths(themeDir)
        .filter(
            filePath =>
                templateExtension === path.extname(filePath).replace('.', '')
        )
        .map(filePath => path.basename(filePath, path.extname(filePath)));

    return templateList;
};

export const getThemeManifest = (theme: string) => {
    if (!theme) {
        return false;
    }

    const manifestPath = path.join(
        getInt('paths.themes'),
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
