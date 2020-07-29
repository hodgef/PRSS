import fs from 'fs';
import path from 'path';

import { getDirPaths } from './files';
import { getJson, getUrl } from './utils';
import {
    prssConfig,
    setCache,
    getCache,
    storeInt
} from '../../common/bootstrap';

export const getTemplate = async (templateId: string, extension: string) => {
    const theme = templateId.split('.')[0];
    const template = templateId.split('.')[1];

    if (prssConfig.themes[theme]) {
        return await getUrl(
            prssConfig.themes[theme] + `/${template}.${extension}`,
            true
        );
    } else {
        const templateRelPath = templateId.split('.').join('/');
        const templatePathName = `${templateRelPath}.${extension}`;

        const templatePath = path.join(
            await storeInt.get('paths.themes'),
            templatePathName
        );

        return fs.readFileSync(templatePath, 'utf8');
    }
};

export const getThemeIndex = async (themeName: string) => {
    if (prssConfig.themes[themeName]) {
        return (await getUrl(
            prssConfig.themes[themeName] + '/index.html',
            true
        )) as string;
    } else {
        const themeDir = path.join(
            await storeInt.get('paths.themes'),
            themeName,
            'index.html'
        );
        return fs.readFileSync(themeDir, 'utf8');
    }
};

export const getDefaultReadme = () => {
    const assetsDir = storeInt.get('paths.assets');
    const readmePath = path.join(assetsDir, 'README.md');
    return fs.readFileSync(readmePath, 'utf8');
};

export const getThemeListDetails = async () => {
    const themeNameList = await getThemeList();
    const themePath = await storeInt.get('paths.themes');

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
    const themeDir = await storeInt.get('paths.themes');
    const templateList = getDirPaths(themeDir).map(filePath =>
        path.basename(filePath)
    );

    const officialThemes = Object.keys(prssConfig.themes || {});
    const localThemes = templateList.filter(
        theme => !officialThemes.includes(theme)
    );

    return [...officialThemes, ...localThemes].sort();
};

export const getTemplateList = async themeName => {
    const res =
        getCache(`manifest-${themeName}`) ||
        ((await getThemeManifest(themeName)) as any) ||
        {};
    return res.templates;
};

export const getThemeManifest = async (theme: string) => {
    if (!theme) {
        return false;
    }

    const manifestPath = path.join(
        await storeInt.get('paths.themes'),
        theme,
        'manifest.json'
    );

    const manifest = prssConfig.themes[theme]
        ? await getJson(prssConfig.themes[theme] + '/manifest.json', true)
        : JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    setCache(`manifest-${theme}`, manifest);
    return manifest;
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
