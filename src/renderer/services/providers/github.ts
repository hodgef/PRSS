import axios from 'axios';
import minify from 'babel-minify';
import fs from 'fs';
import path from 'path';
import slash from 'slash';

import { build } from '../build';
import { getFilePaths } from '../files';
import { getTemplate } from '../templates';
import { confirmation, error, exclude, get, getString } from '../utils';
import { sequential } from './../utils';

class Github {
    private readonly site: ISite;
    public readonly vars = {
        baseApiUrl: () => 'https://api.github.com/'
    };
    public static hostingTypeDef = {
        title: 'Github',
        fields: [
            {name: 'username', title: 'Github Username', type: 'text'},
            {name: 'token', title: 'Github Token', type: 'password'}
        ]
    };

    constructor(site: ISite) {
        this.site = site;
    }

    setup = async (updates) => {

        /**
         * Creating repo
         */
        updates(getString('creating_repository'));
        const createRepoRes = await this.createRepo();

        if (!createRepoRes) return false;


        /**
         * Build project based on theme and structure
         */
        const buildRes = build(this.site);

        console.log('buildRes', buildRes);

        /**
         * Uploading theme files
         */
        // const uploadThemeFilesResArr = await this.uploadThemeFiles(updates) || [];

        // if (!uploadThemeFilesResArr.every(item => !!item.content)) {
        //     error(getString('error_uploading_theme_files'));
        //     return false;
        // }

        /**
         * Uploading prss-client
         */
        // updates(getString('completing_setup'));
        // const uploadConfigRes = await this.uploadConfig();

        // if (!uploadConfigRes || !uploadConfigRes.content) {
        //     error(getString('error_completing_setup'));
        //     return false;
        // }

        // /**
        //  * Enabling pages site
        //  */
        // const siteUrl = await this.enablePagesSite();

        // if (!siteUrl) {
        //     error(getString('error_setup_remote'));
        //     return false;
        // }

        return this.site;

        // return {
        //     ...this.site,
        //     url: siteUrl
        // };
    }

    uploadConfig = async () => {
        const { code: prssTemplate } = minify(
            getTemplate('prss', {
                site: JSON.stringify(exclude(this.site, ['hosting']))
            })
        );

        return this.createFile('assets/js/prss.js', prssTemplate);
    }

    enablePagesSite = async () => {
        const endpoint = `repos/${this.site.hosting.username}/${this.site.id}/pages`;
        const existingSite = await this.request('GET', endpoint);

        if (existingSite && existingSite.html_url) {
            return existingSite.html_url;
        }

        const { html_url } = await this.request('POST', endpoint, {
            source: {
                branch: 'master',
                directory: '/'
            }
        }, { Accept : 'application/vnd.github.switcheroo-preview+json' }) || {};

        return html_url;
    }

    uploadThemeFiles = async (updates) => {
        const themeDir = get('paths.themes');
        const themeTypeDir = path.join(themeDir, this.site.type, this.site.theme);
        const themeFilePaths = await getFilePaths(themeTypeDir);

        if (!themeFilePaths || !themeFilePaths.length) {
            error(getString('error_no_theme_files'));
            return;
        }

        return this.uploadFiles(themeFilePaths, themeTypeDir, (progress) => {
            updates && updates(getString('uploading_theme_files', [progress]));
        });
    }

    uploadFiles = async (filePaths = [], basePath = '', updater?) => {
        if (!filePaths.length) return;
        
        const fileRequests = filePaths.map(filePath => {
            const normalizedBasePath = slash(basePath);
            const normalizedFilePath = slash(filePath);
            const remoteFilePath = normalizedFilePath.replace(normalizedBasePath + '/', '');

            return [
                'PUT',
                `repos/${this.site.hosting.username}/${this.site.id}/contents/${remoteFilePath}`,
                {
                    message: `Added ${remoteFilePath}`,
                    content: btoa(fs.readFileSync(filePath, 'utf8'))
                }
            ]
        });

        return sequential(fileRequests, this.uploadOrUpdateFile, 1000, updater);
    }

    uploadOrUpdateFile = async (method, endpoint, data = {} as any, headers = {}) => {
        /**
         * Check if file is already uploaded
         */
        const existingFile = await this.request('GET', endpoint);
        
        if (existingFile && existingFile.sha) {
            /**
             * If content is the same, skip
             */
            if (JSON.stringify(`"${atob(existingFile.content)}"`) === JSON.stringify(`"${atob(data.content)}"`)) {
                return Promise.resolve({ content: existingFile });
            }

            data = {...data, sha: existingFile.sha};
        }

        return this.request(method, endpoint, data, headers);
    }

    createFile = async (path: string, content = '') => {
        return this.uploadOrUpdateFile('PUT', `repos/${this.site.hosting.username}/${this.site.id}/contents/${path}`, {
            message: `Added ${path}`,
            content: btoa(content)
        });
    }

    createRepo = async () => {
        const repo = await this.getRepo();

        if (repo) {
            const confirmationRes = await confirmation({
                title: 'The repository already exists. Do you want to use it?'
            });
            
            if (confirmationRes !== 0) {
                error(getString('action_cancelled'));
                return false;
            } else {
                return true;
            }
        }

        const { created_at } = await this.request('POST', 'user/repos', {
            name: this.site.id,
            description: getString('created_with'),
            homepage: getString('prss_domain'),
            auto_init: true
        }) || {};

        if (!created_at) {
            error(getString('error_repo_creation'));
            return false;
        }

        return true;
    }

    getRepo = async () => {
        const repos = await this.request('GET', `users/${this.site.hosting.username}/repos`) || [];

        if (!Array.isArray(repos)) {
            error();
            return false;
        }

        const repo = repos.find(item => item.name === this.site.id);
        return repo;
    }

    request: RequestType = (method, endpoint, data = {}, headers = {}) => {
        const url = this.vars.baseApiUrl() + endpoint;
        return axios({
            method,
            url,
            auth: {
                username: this.site.hosting.username,
                password: this.site.hosting.token
            },
            data,
            headers
        })
        .then(response => response.data)
        .catch(res => res);
    }
}

export default Github;