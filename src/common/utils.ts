import { store, storeInt } from "./bootstrap";
import strings from "./strings.json";

export const configSet = (...params) =>
  typeof params[0] === "object"
    ? store.set(params[0])
    : store.set(params[0], params[1]);
export const configGet = (param: any) => store.get(param);
export const configRem = (param: any) => store.delete(param);

const { app } = require("@electron/remote");
const execSync = require("child_process").execSync;
const isDevelopment = process.env.NODE_ENV !== "production";

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
  window.localStorage.setItem(key, value);
};

export const localStorageGet = async (key: string) => {
  return window.localStorage.getItem(key);
};

export const localStorageDelete = async (key: string) => {
  window.localStorage.removeItem(key);
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

export const getConfigPath = async () => {
  return (await storeInt.get("paths.config")) || app.getPath("userData");
};
