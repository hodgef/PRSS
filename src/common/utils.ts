import { store, storeInt } from "./bootstrap";
import strings from "./strings.json";

export const configSet = (...params) =>
  typeof params[0] === "object"
    ? store.set(params[0])
    : store.set(params[0], params[1]);
export const configGet = (param: any) => store.get(param);
export const configRem = (param: any) => store.delete(param);

const util = require('util');
const { app } = require("@electron/remote");
const execSync = require("child_process").execSync;
const execAsync = util.promisify(require('child_process').exec);
const isDevelopment = process.env.NODE_ENV !== "production";
const path = require('path');

export const getString = (id: string, replaceWith: string[] = []) => {
  let str = strings[id] || "";

  replaceWith.forEach((replacement) => {
    str = str.replace("%s", replacement);
  });

  return str;
};

export const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

export const localStorageSet = async (key: string, value: string) => {
  return window.localStorage.setItem(key, value);
};

export const localStorageGet = async (key: string) => {
  return window.localStorage.getItem(key);
};

export const localStorageDelete = async (key: string) => {
  return window.localStorage.removeItem(key);
};

export const runCommand = (dir, cmd) => {
  if (!dir) throw new Error("Working dir must be provided.");

  try {
    const res = execSync(`cd ${dir} && ${cmd}`).toString();
    if (isDevelopment) {
      console.log("runCommand", cmd, res);
    }
    return { res, error: false };
  } catch (e) {
    if (isDevelopment) {
      console.error("runCommand", cmd, e);
    }
    return { res: e, error: true };
  }
};

export const runCommandAsync = async (dir, cmd) => {
  if (!dir) throw new Error("Working dir must be provided.");

  try {
    const { stderr, stdout } = (await execAsync(`cd ${dir} && ${cmd}`));
    if (isDevelopment) {
      console.log("runCommand", cmd, stdout, stderr);
    }
    return { res: stdout, error: false };
  } catch (e) {
    if (isDevelopment) {
      console.error("runCommand", cmd, e);
    }
    return { res: e, error: true };
  }
};

export const getConfigPath = async (): Promise<string> => {
  return (await storeInt.get("paths.config")) || app.getPath("userData");
};

export const isReportIssuesEnabled = async () => {
  return (await storeInt.get("reportIssues")) === false ? false : true;
};

export const getMachineId = async () => {
  return await storeInt.get("machineId");
};

export const getRootPath = (): string => {
  return app.isPackaged ? app.getPath('userData') : app.getPath('exe').split("node_modules")[0];
}

export const getStaticPath = (): string => {
  return path.join(app.isPackaged && !process.resourcesPath?.includes("WindowsApps") ? process.resourcesPath : getRootPath(), 'static');
};

export const getCurrentVersion = () => {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const { app } = require("@electron/remote");
  let currentVersion;

  if (isDevelopment) {
    currentVersion = require("../../package.json").version;
  } else {
    currentVersion = app.getVersion();
  }
  
  return currentVersion;
};
