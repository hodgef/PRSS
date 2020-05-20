import Store from 'electron-store';
import path from 'path';
import fs from 'fs';
import knex from 'knex';
import { mapFieldsFromJSON } from '../renderer/services/utils';

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
            name: 'PRSS',
            defaults
        });

        const paths = (await store.get('paths')) || {};

        store.set({
            paths: {
                ...paths,
                assets: path.join(__static, 'assets'),
                buffer: path.join(__static, 'buffer'),
                public: path.join(__static, 'public'),
                themes: path.join(__static, 'themes'),
                vendor: path.join(__static, 'vendor')
            }
        });

        resolve();
    });
};

const init = async () => {
    await initStore();
    await initDb();
};

export { init, store, db, JSON_FIELDS };
