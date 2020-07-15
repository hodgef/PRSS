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
let hooks = {};

const expressUrl = 'http://127.0.0.1:3001';

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
    expressApp = express();
    const passport = require('passport');
    const GitHubStrategy = require('passport-github2').Strategy;

    expressApp.use(passport.initialize());

    const filter = {
        urls: ['*://*.prss.io/*']
    };
    const session = require('electron').remote.session;
    session.defaultSession.webRequest.onBeforeSendHeaders(
        filter,
        (details, callback) => {
            details.requestHeaders['Origin'] = null;
            details.headers['Origin'] = null;
            callback({ requestHeaders: details.requestHeaders });
        }
    );

    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });

    passport.use(
        new GitHubStrategy(
            {
                clientID:
                    process.env.GH_CLIENT_ID || dotenv.parsed?.GH_CLIENT_ID,
                clientSecret:
                    process.env.GH_CLIENT_SECRET ||
                    dotenv.parsed?.GH_CLIENT_SECRET,
                callbackURL: 'http://127.0.0.1:3001/auth/github/callback'
            },
            function(accessToken, refreshToken, profile, done) {
                process.nextTick(function() {
                    runHook('github_login_success', {
                        token: accessToken,
                        profile
                    });

                    // To keep the example simple, the user's GitHub profile is returned to
                    // represent the logged-in user.  In a typical application, you would want
                    // to associate the GitHub account with a user record in your database,
                    // and return that user instead.
                    return done(null, profile);
                });
            }
        )
    );

    expressApp.get('/', function(req, res) {
        res.send('PRSS');
    });
    expressApp.get('/login-error', function(req, res) {
        res.send('Could not log-in - Please try again later');
    });

    expressServer = expressApp.listen(3001, function() {
        console.log(
            'Express server listening on port ' + expressServer.address().port
        );
    });

    expressApp.get(
        '/auth/github',
        passport.authenticate('github', { failureRedirect: '/login-error' }),
        function(req, res) {
            // The request will be redirected to GitHub for authentication, so this
            // function will not be called.
        }
    );

    expressApp.get(
        '/auth/github/callback',
        passport.authenticate('github', { failureRedirect: '/login-error' }),
        function(req, res) {
            res.send(
                'Success - You can now close this page and return to PRSS'
            );
        }
    );
};

const expressOpen = path => {
    window.open(expressUrl + path);
};

const init = async () => {
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
    expressOpen,
    setHook,
    runHook,
    getHooks,
    clearHooks,
    JSON_FIELDS
};
