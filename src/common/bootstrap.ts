import Store from "electron-store";
const path = require("path");
import fs from "fs";
import knex from "knex";
import {
  mapFieldsFromJSON,
  getPRSSConfig,
} from "../renderer/services/utils";
import { getConfigPath, getCurrentVersion, getPlatform, getStaticPath, isAppx } from "./utils";
import { IConfig, IStore, IStoreInternal } from "./interfaces";
import { machineIdSync } from 'node-machine-id';

export const JSON_FIELDS = [
  "structure",
  "menus",
  "vars",
  "exclusiveVars",
  "isContentRaw",
];

const defaultsInt = {
  paths: {},
} as IStoreInternal;

const defaults = {
  sites: {},
} as IStore;

export let store;
export let storeInt;
export let db;
export let expressApp;
export let expressServer;
export let hooks = {};
export let prssConfig: IConfig;
let machineId;
const cache = {};

const expressUrl = "http://127.0.0.1:3001";
export const getApiUrl = (path = "/") => {
  const url = new URL(`https://prss.volted.co/${path}`);
  if(isAppx()){
    url.searchParams.set("s", "1");
  }
  if(getPlatform()){
    url.searchParams.set("p", getPlatform());
  }
  if(machineId){
    url.searchParams.set("m", machineId);
  }
  if(getCurrentVersion()){
    url.searchParams.set("v", getCurrentVersion());
  }
  return url.href;
};

export const setHook = (name, fct) => {
  hooks[name] = fct;
};

export const getHooks = () => {
  return hooks;
};

export const runHook = (name, params?) => {
  if (hooks[name]) {
    if (params) hooks[name](params);
    else hooks[name]();
  }
};

export const clearHook = (name) => {
  delete hooks[name];
};

export const clearHooks = () => {
  hooks = {};
};

export const setCache = (name, val) => {
  cache[name] = val;
};

export const getCache = (name) => cache[name];
export const deleteCache = (name) => delete cache[name];

export const initDb = async () => {
  const storePath = await getConfigPath();
  const dbFile = path.join(storePath, "prss.db");
  const dbExists = fs.existsSync(dbFile);

  db = knex({
    client: "sqlite3",
    connection: {
      filename: dbFile,
    },
    useNullAsDefault: true,
    postProcessResponse: (result) => {
      if (Array.isArray(result)) {
        if (result && typeof result[0] === "object") {
          const output = result.map((res) =>
            mapFieldsFromJSON(JSON_FIELDS, res)
          );
          return output;
        } else {
          return result;
        }
      } else if (typeof result === "object") {
        const output = mapFieldsFromJSON(JSON_FIELDS, result);
        return output;
      } else {
        return result;
      }
    },
  });

  if (!dbExists) {
    return db.schema
      .createTable("sites", (table) => {
        table.increments("id");
        table.string("uuid");
        table.string("name");
        table.string("title");
        table.string("url");
        table.string("theme");
        table.integer("updatedAt");
        table.integer("createdAt");
        table.integer("publishedAt");
        table.string("headHtml");
        table.string("footerHtml");
        table.string("sidebarHtml");
        table.string("structure");
        table.string("vars");
        table.string("menus");
      })
      .createTable("items", (table) => {
        table.increments("id");
        table.string("uuid");
        table.string("siteId");
        table.string("slug");
        table.string("title");
        table.string("content");
        table.string("template");
        table.string("headHtml");
        table.string("footerHtml");
        table.string("sidebarHtml");
        table.integer("updatedAt");
        table.integer("createdAt");
        table.string("vars");
        table.string("isContentRaw");
        table.string("exclusiveVars");
      });
  }

  return db;
};

export const initStore = () => {
  return new Promise(async (resolve) => {
    if (store) {
      resolve(null);
    }

    /**
     * StoreInt
     */
    storeInt = new Store({
      projectName: "prss-int",
      name: "prss-int",
      defaultsInt,
    } as any);

    machineId = storeInt.get("machineId");
    if(!machineId){
      machineId = machineIdSync();
      storeInt.set({ machineId });
    }

    const staticsPath = getStaticPath();

    console.log("_static", staticsPath);

    const paths = (await storeInt.get("paths")) || {};

    const envPath = path.join(staticsPath, "env");
    const configPath = await getConfigPath();
    const assetsPath = path.join(staticsPath, "assets");
    const themesPath = path.join(staticsPath, "themes");
    const bufferPath = path.join(staticsPath, "buffer");
    const publicPath = path.join(staticsPath, "public");
    const vendorPath = path.join(staticsPath, "vendor");

    const storeIntPaths =  {
      ...paths,
      env: envPath,
      config: configPath,
      assets: assetsPath,
      buffer: bufferPath,
      public: publicPath,
      themes: themesPath,
      vendor: vendorPath,
    };

    storeInt.set({
      paths: storeIntPaths
    });
    
    /**
     * Store
     */
    store = new Store({
      projectName: "prss",
      name: "prss",
      cwd: configPath,
      defaults,
    } as any);

    /**
     * Creating statics dir if it doesn't exist
     */
    if (!fs.existsSync(staticsPath)) {
      fs.mkdirSync(staticsPath);
    }

    /**
     * Creating themes dir if it doesn't exist
     */
    if (!fs.existsSync(themesPath)) {
      fs.mkdirSync(themesPath);
    }

    resolve(storeIntPaths);
  });
};

export const initExpress = async () => {
  /**
   * Start Express
   */
  const express = require("express");
  expressApp = express();

  expressServer = expressApp.listen(3001, function () {
    console.log(
      "Express server listening on port " + expressServer.address().port
    );
  });

  expressApp.get("/", function (req, res) {
    res.send("PRSS");
  });

  expressApp.get("/github/callback", async (req, res) => {
    res.send("Success - You can now close this page and return to PRSS");
    const token = req.query.t;
    const username = req.query.u;

    if (token && username) {
      runHook("github_login_success", { token, username });
    }
  });
};

export const expressOpen = (path) => {
  window.open(expressUrl + path);
};

export const initConfig = async () => {
  prssConfig = await getPRSSConfig();
};
