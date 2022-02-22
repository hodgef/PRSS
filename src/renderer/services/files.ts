import fs from "fs";
import path from "path";

export const getFilePaths = dir =>
  fs.readdirSync(dir).reduce((files, file) => {
    const name = path.join(dir, file);
    const isDirectory = fs.statSync(name).isDirectory();
    return isDirectory ? [...files, ...getFilePaths(name)] : [...files, name];
  }, []);

export const getDirPaths = dir =>
  fs.readdirSync(dir).reduce((files, file) => {
    const name = path.join(dir, file);
    const isDirectory = fs.statSync(name).isDirectory();
    return !isDirectory ? [...files] : [...files, name];
  }, []);
