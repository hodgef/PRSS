import fs from 'fs';
import path from 'path';

import { getFilePaths, getDirPaths } from './files';
import { getParserTemplateExtension } from './handlers';
import { configGet } from '../../common/utils';

export const getTemplate = async (templateId: string, extension: string) => {
    const templateRelPath = templateId.split('.').join('/');
    const templatePathName = `${templateRelPath}.${extension}`;

    const templatePath = path.join(
        await configGet('paths.themes'),
        templatePathName
    );

    return fs.readFileSync(templatePath, 'utf8');
};

export const getThemeIndex = async (themeName: string) => {
    const themeDir = path.join(
        await configGet('paths.themes'),
        themeName,
        'index.html'
    );
    return fs.readFileSync(themeDir, 'utf8');
};

export const getDefaultReadme = () => {
    const assetsDir = configGet('paths.assets');
    const readmePath = path.join(assetsDir, 'README.md');
    return fs.readFileSync(readmePath, 'utf8');
};

export const getThemeListDetails = async () => {
    const themeNameList = await getThemeList();
    const themePath = await configGet('paths.themes');

    const manifestPromises = [];

    themeNameList.forEach(themeName => {
        manifestPromises.push(getThemeManifest(themeName));
    });

    const promiseValues = await Promise.all(manifestPromises);

    return themeNameList.map((themeName, index) => {
        const themeDir = path.join(themePath, themeName);
        return {
            ...(promiseValues[index] || {}),
            name: themeName,
            themeDir: themeDir
        };
    });
};

export const getThemeList = async () => {
    const themeDir = path.join(await configGet('paths.themes'));
    const templateList = getDirPaths(themeDir).map(filePath =>
        path.basename(filePath)
    );
    return templateList;
};

export const getTemplateList = async themeName => {
    const themeDir = path.join(await configGet('paths.themes'), themeName);
    const themeManifest = (await getThemeManifest(themeName)) || {};
    const templateExtension = getParserTemplateExtension(themeManifest.parser);

    const templateList = getFilePaths(themeDir)
        .filter(
            filePath =>
                templateExtension === path.extname(filePath).replace('.', '')
        )
        .map(filePath => path.basename(filePath, path.extname(filePath)));

    return templateList;
};

export const getThemeManifest = async (theme: string) => {
    if (!theme) {
        return false;
    }

    const manifestPath = path.join(
        await configGet('paths.themes'),
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
