import fs from "fs";
import fse from "fs-extra";
import path from "path";

import { getDirPaths } from "./files";
import { getJson, getUrl } from "./utils";
import {
  prssConfig,
  setCache,
  getCache,
  storeInt,
} from "../../common/bootstrap";
import { IThemeManifest } from "../../common/interfaces";

export const getTemplate = async (templateId: string, extension: string) => {
  const cacheKey = `getThemeTemplate-${templateId}`;
  let themeTemplate = getCache<string>(cacheKey);

  if(themeTemplate){
    return themeTemplate;
  }

  const theme = templateId.split(".")[0];
  const template = templateId.split(".")[1];

  if (prssConfig.themes[theme]) {
    themeTemplate = await getUrl(
      prssConfig.themes[theme] + `/${template}.${extension}`,
      true
    ) as string;
  } else {
    const templateRelPath = templateId.split(".")[1];
    const templatePathName = `${templateRelPath}.${extension}`;

    const templatePath = path.join(
      getLocalThemePath(theme),
      templatePathName
    );

    themeTemplate = await fse.readFile(templatePath, "utf8");
  }
  setCache(cacheKey, [Date.now(), themeTemplate]);
  return themeTemplate;
};

export const getThemeIndex = async (themeName: string) => {
  const cacheKey = `getThemeIndex-${themeName}`;
  let themeIndex = getCache<string>(cacheKey);
  
  if(themeIndex){
    return themeIndex;
  }

  if (prssConfig.themes[themeName]) {
    themeIndex = (await getUrl(
      prssConfig.themes[themeName] + "/index.html",
      true
    )) as string;
  } else {
    const themeDir = path.join(getLocalThemePath(themeName), "index.html");
    themeIndex = await fse.readFile(themeDir, "utf8");
  }
  setCache(cacheKey, [Date.now(), themeIndex]);
  return themeIndex;
};

export const getDefaultReadme = () => {
  const assetsDir = storeInt.get("paths.assets");
  const readmePath = path.join(assetsDir, "README.md");
  return fs.readFileSync(readmePath, "utf8");
};

export const getThemeListDetails = async (fetchManifest?: boolean) => {
  const themeNameList = await getThemeList();
  const themePath = storeInt.get("paths.themes");

  const manifestPromises = [];
  let manifestPromiseData = {};

  if(fetchManifest){
    themeNameList.forEach((themeName) => {
      manifestPromises.push(getThemeManifest(themeName));
    });

    manifestPromiseData = await Promise.all(manifestPromises);
  }

  return themeNameList.map((themeName, index) => {
    const themeDir = path.join(themePath, themeName);
    return {
      ...(manifestPromiseData[index] || {}),
      name: themeName,
      themeDir: themeDir,
    };
  });
};

export const getThemeList = async () => {
  const themeDir = storeInt.get("paths.themes");
  const templateList = getDirPaths(themeDir).map((filePath) =>
    path.basename(filePath)
  );

  const officialThemes = Object.keys(prssConfig.themes || {});
  const localThemes = templateList.filter(
    (theme) => !officialThemes.includes(theme)
  );

  return [...officialThemes, ...localThemes].sort();
};

export const getTemplateList = async (themeName) => {
  const res =
    getCache(`manifest-${themeName}`) ||
    ((await getThemeManifest(themeName)) as any) ||
    {};
  return res.templates;
};

export const getThemeManifest = async (theme: string): Promise<IThemeManifest> => {
  if (!theme) {
    return;
  }

  let manifest: IThemeManifest;

  // Config theme
  if(prssConfig.themes[theme]){
    manifest = (await getJson(prssConfig.themes[theme] + "/manifest.json", true)) as IThemeManifest;
  } else {
    const themePath = getLocalThemePath(theme);
    let manifestPath = path.join(themePath, "manifest.json");
    manifest = JSON.parse(await fse.readFile(manifestPath, "utf8"));
    manifest.isLocal = true;
  }

  if(manifest) {
    setCache(`manifest-${theme}`, manifest);
    return manifest;
  }
};

export const getLocalThemePath = (themeName: string) => {
  const themesDir = storeInt.get("paths.themes");
  const themePath = path.join(themesDir, themeName);

  if(fs.existsSync(path.join(themePath, "build"))){
    return path.join(themePath, "build");
  } else {
    return path.join(themePath);
  }
}


export const baseTemplate = ({ head = "", body = "" }: any) => {
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
