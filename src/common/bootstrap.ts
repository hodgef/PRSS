import Store from 'electron-store';
import path from 'path';
import fs from 'fs';
import knex from 'knex';
import {
    mapFieldsFromJSON,
    getGithubSecureAuth,
    getPRSSConfig
} from '../renderer/services/utils';

const JSON_FIELDS = [
    'structure',
    'menus',
    'vars',
    'exclusiveVars',
    'isContentRaw'
];

const { app } = require('electron').remote;

const defaults = {
    sites: {},
    paths: {}
} as IStore;

let store;
let db;
let expressApp;
let expressServer;
let hooks = {};
let prssConfig;
const cache = {};

const expressUrl = 'http://127.0.0.1:3001';
const getApiUrl = (path = '/') => `https://app.prss.io/api${path}`;

const setHook = (name, fct) => {
    hooks[name] = fct;
};

const getHooks = () => {
    return hooks;
};

const runHook = (name, params?) => {
    if (hooks[name]) {
        if (params) hooks[name](params);
        else hooks[name]();
    }
};

const clearHooks = () => {
    hooks = {};
};

const setCache = (name, val) => {
    cache[name] = val;
};

const getCache = name => cache[name];

const deleteCache = name => delete cache[name];

const initDb = async () => {
    const storePath = await store.get('paths.db');
    const dbFile = path.join(storePath || app.getPath('userData'), 'prss.db');
    const dbExists = fs.existsSync(dbFile);

    db = knex({
        client: 'sqlite3',
        connection: {
            filename: dbFile
        },
        useNullAsDefault: true,
        postProcessResponse: (result, queryContext) => {
            if (Array.isArray(result)) {
                if (result && typeof result[0] === 'object') {
                    const output = result.map(res =>
                        mapFieldsFromJSON(JSON_FIELDS, res)
                    );
                    return output;
                } else {
                    return result;
                }
            } else if (typeof result === 'object') {
                const output = mapFieldsFromJSON(JSON_FIELDS, result);
                return output;
            } else {
                return result;
            }
        }
    });

    if (!dbExists) {
        return db.schema
            .createTable('sites', table => {
                table.increments('id');
                table.string('uuid');
                table.string('name');
                table.string('title');
                table.string('url');
                table.string('theme');
                table.integer('updatedAt');
                table.integer('createdAt');
                table.integer('publishedAt');
                table.string('headHtml');
                table.string('footerHtml');
                table.string('sidebarHtml');
                table.string('structure');
                table.string('vars');
                table.string('menus');
            })
            .createTable('items', table => {
                table.increments('id');
                table.string('uuid');
                table.string('siteId');
                table.string('slug');
                table.string('title');
                table.string('content');
                table.string('template');
                table.string('headHtml');
                table.string('footerHtml');
                table.string('sidebarHtml');
                table.integer('updatedAt');
                table.integer('createdAt');
                table.string('vars');
                table.string('isContentRaw');
                table.string('exclusiveVars');
            });
    }

    return db;
};

const initStore = () => {
    return new Promise(async resolve => {
        if (store) {
            resolve();
        }

        store = new Store({
            name: 'prss',
            defaults
        });

        const paths = (await store.get('paths')) || {};
        const envPath = path.join(__static, 'env');
        const assetsPath = path.join(__static, 'assets');
        const themesPath = path.join(__static, 'themes');
        const bufferPath = path.join(__static, 'buffer');
        const publicPath = path.join(__static, 'public');
        const vendorPath = path.join(__static, 'vendor');

        store.set({
            paths: {
                ...paths,
                env: envPath,
                assets: assetsPath,
                buffer: bufferPath,
                public: publicPath,
                themes: themesPath,
                vendor: vendorPath
            }
        });

        /**
         * Creating themes dir if it doesn't exist
         */
        if (!fs.existsSync(themesPath)) {
            fs.mkdirSync(themesPath);
        }

        resolve();
    });
};

const initExpress = async () => {
    /**
     * Start Express
     */
    const express = require('express');
    expressApp = express();

    expressServer = expressApp.listen(3001, function() {
        console.log(
            'Express server listening on port ' + expressServer.address().port
        );
    });

    expressApp.get('/', function(req, res) {
        res.send('PRSS');
    });

    expressApp.get('/github/callback', async (req, res) => {
        res.send('Success - You can now close this page and return to PRSS');
        const code = req.query.c;
        if (code) {
            const { token, username } = await getGithubSecureAuth(code);
            if (token && username) {
                runHook('github_login_success', { token, username });
            }
        }
    });
};

const expressOpen = path => {
    window.open(expressUrl + path);
};

const init = async () => {
    prssConfig = await getPRSSConfig();
    await initStore();
    await initDb();
    await initExpress();
};

export {
    init,
    store,
    db,
    expressApp,
    expressServer,
    prssConfig,
    getCache,
    setCache,
    deleteCache,
    expressOpen,
    getApiUrl,
    setHook,
    runHook,
    getHooks,
    clearHooks,
    JSON_FIELDS
};
