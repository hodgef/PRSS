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
const dotenv = require('dotenv').config({ path: path.join(__static, '.env') });

const defaults = {
    sites: {},
    paths: {}
} as IStore;

let store;
let db;
let expressApp;
let expressServer;

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
                env: path.join(__static, 'env'),
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

const initExpress = async () => {
    /**
     * Start Express
     */
    const express = require('express');
    const passport = require('passport');
    expressApp = express();
    expressApp.get('/', function(req, res) {
        res.send('PRSS');
    });
    expressServer = expressApp.listen(3001, function() {
        console.log(
            'Express server listening on port ' + expressServer.address().port
        );
    });

    expressApp.get('/auth/github', passport.authenticate('github'));

    expressApp.get(
        '/auth/github/callback',
        passport.authenticate('github', { failureRedirect: '/login' }),
        function(req, res) {
            // Successful authentication, redirect home.
            res.redirect('/');
        }
    );

    const GitHubStrategy = require('passport-github').Strategy;

    passport.use(
        new GitHubStrategy(
            {
                clientID:
                    process.env.GITHUB_CLIENT_ID ||
                    dotenv.parsed?.GITHUB_CLIENT_ID,
                clientSecret:
                    process.env.GITHUB_CLIENT_SECRET ||
                    dotenv.parsed?.GITHUB_CLIENT_SECRET,
                callbackURL: 'http://127.0.0.1:3000/auth/github/callback'
            },
            function(accessToken, refreshToken, profile, cb) {
                console.log('PASSW', accessToken, refreshToken, profile, cb);
            }
        )
    );
};

const init = async () => {
    await initStore();
    await initDb();
    await initExpress();
};

export { init, store, db, expressApp, expressServer, JSON_FIELDS };
