import { keychainRetreive, getInt } from './../../../common/utils';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import slash from 'slash';
import del from 'del';

import { getString } from '../../../common/utils';
import {
    bufferPathFileNames,
    build,
    configFileName,
    getFilteredBufferItems,
    clearBuffer
} from '../build';
import { confirmation, error } from '../utils';
import { sequential } from './../utils';
import { modal } from '../../components/Modal';

class GithubProvider {
    private readonly site: ISite;
    public readonly vars = {
        baseUrl: () => 'github.com',
        baseApiUrl: () => 'api.github.com'
    };
    public static hostingTypeDef = {
        title: 'Github',
        fields: [
            {
                name: 'username',
                title: 'Github Username',
                description: '',
                type: 'text'
            },
            {
                name: 'token',
                title: 'Github Token',
                description: `
                    <p>A Github token with "repo" permissions is required.</p>
                    <p>Your token will be stored locally in your OS keychain (secure store).</p>
                `,
                type: 'password'
            },
            {
                name: 'repository',
                title: 'Github Repository Name (optional)',
                description: `
                    <p>If you'll be using your own repository to serve your site, enter the repository name.</p>
                    <p>For example: <span class="code-dark-inline">myRepo</span>
                    <p>If you're connecting to someone else's repository, use the username/repository syntax.</p>
                    <p>For example: <span class="code-dark-inline">username/repoName</span>
                    <p>Please ensure that you can access the repository locally through Git.</p>
                `,
                type: 'text',
                optional: true
            }
        ]
    };

    constructor(site: ISite) {
        this.site = site;
    }

    setup = async onUpdate => {
        /**
         * Creating repo
         */
        const { hosting } = getInt(`sites.${this.site.id}`);

        if (this.getUsername() === hosting.username) {
            onUpdate(getString('creating_repository'));
            const createRepoRes = await this.createRepo();

            if (!createRepoRes) return false;
        }

        /**
         * Deploy project
         */
        await this.deploy(onUpdate, null, true);

        /**
         * Enabling pages site
         */
        const siteUrl = await this.enablePagesSite();

        if (!siteUrl) {
            if (!modal.isShown()) {
                error(getString('error_setup_remote'));
            }
            return false;
        }

        return {
            ...this.site,
            url: siteUrl
        };
    };

    getUsername = () => {
        const { hosting } = getInt(`sites.${this.site.id}`);
        const { username, repository } = hosting;

        if (repository && repository.includes('/')) {
            return repository.split('/')[0];
        } else {
            return username;
        }
    };

    getRepositoryName = () => {
        const { id } = this.site;

        const {
            hosting: { repository }
        } = getInt(`sites.${this.site.id}`);

        if (repository) {
            if (repository.includes('/')) {
                return repository.split('/')[1];
            } else {
                return repository;
            }
        } else {
            return id;
        }
    };

    getRepositoryUrl = () => {
        return `https://${this.vars.baseUrl()}/${this.getUsername()}/${this.getRepositoryName()}`;
    };

    deploy = async (onUpdate = s => {}, itemIdToDeploy?, clearRemote?) => {
        /**
         * Clearing buffer
         */
        await clearBuffer(true);

        /**
         * Creating git repo in buffer
         */
        try {
            const bufferDir = getInt('paths.buffer');
            const execSync = require('child_process').execSync;

            execSync(
                `cd "${bufferDir}" && git clone "${this.getRepositoryUrl()}" .`
            );

            const buildRes = await build(
                this.site,
                onUpdate,
                itemIdToDeploy,
                !clearRemote
            );

            if (!buildRes) {
                error(getString('error_buffer'));
                return false;
            }

            onUpdate('Deploying');

            await new Promise(resolve => {
                setTimeout(() => {
                    try {
                        execSync(
                            `cd "${bufferDir}" && git add --all && git commit -m "Site update" && git push`
                        );
                    } catch (e) {
                        modal.alert(e.message);
                        console.error(e);
                    }
                    resolve();
                }, 1000);
            });
        } catch (e) {
            modal.alert(e.message);
            console.error(e);
        }

        await clearBuffer(true);
        return true;
    };

    deployWithAPI = async (onUpdate?, itemIdToDeploy?) => {
        const { itemsToLoad } = getFilteredBufferItems(
            this.site,
            itemIdToDeploy
        );

        const bufferDir = getInt('paths.buffer');

        const siteConfigFilePath = path.join(bufferDir, configFileName);

        const bufferFilePaths = [siteConfigFilePath];

        itemsToLoad.forEach(item => {
            const baseFilePath = path.join(bufferDir, item.path);

            bufferPathFileNames.forEach(bufferPathFileName => {
                const filePath = path.join(baseFilePath, bufferPathFileName);

                try {
                    if (fs.existsSync(filePath)) {
                        bufferFilePaths.push(filePath);
                    }
                } catch (err) {
                    console.error(err);
                }
            });
        });

        return this.uploadFiles(bufferFilePaths, bufferDir, progress => {
            onUpdate && onUpdate(getString('deploying_progress', [progress]));
        });
    };

    /**
     * This uses git, as deleting files one by one through the API
     * will probably deplete the request quota
     */
    wipe = async (onUpdate?) => {
        const repoUrl = this.getRepositoryUrl();
        const confirmationRes = await confirmation({
            title: `This operation requires clearing all files in "${repoUrl}". Continue?`
        });

        if (confirmationRes !== 0) {
            error(getString('action_cancelled'));
            return false;
        }

        onUpdate && onUpdate('Clearing remote');

        /**
         * Clearing buffer
         */
        await clearBuffer();

        /**
         * Creating git repo in buffer
         */
        try {
            const bufferDir = getInt('paths.buffer');
            const execSync = require('child_process').execSync;

            execSync(
                `cd "${bufferDir}" && git clone "${this.getRepositoryUrl()}" .`
            );

            if (bufferDir && bufferDir.includes('buffer')) {
                await del([path.join(bufferDir, '*'), '!.git']);
            }

            execSync(
                `cd "${bufferDir}" && git add --all && git commit -m "Clearing for deployment" && git push`
            );
        } catch (e) {
            modal.alert(e.message);
            console.error(e);
        }

        await clearBuffer();
        return true;
    };

    enablePagesSite = async () => {
        const endpoint = `repos/${this.getUsername()}/${this.getRepositoryName()}/pages`;
        const existingSite = await this.request('GET', endpoint);

        if (existingSite && existingSite.html_url) {
            return existingSite.html_url;
        }

        const { html_url } =
            (await this.request(
                'POST',
                endpoint,
                {
                    source: {
                        branch: 'master',
                        directory: '/'
                    }
                },
                { Accept: 'application/vnd.github.switcheroo-preview+json' }
            )) || {};

        return html_url;
    };

    deleteFiles = async (filePaths = [], basePath = '', onUpdate?) => {
        if (!filePaths.length) return;

        const fileRequests = filePaths.map(filePath => {
            const normalizedBasePath = slash(basePath);
            const normalizedFilePath = slash(filePath);
            const remoteFilePath = normalizedFilePath.replace(
                normalizedBasePath + '/',
                ''
            );

            return [
                'DELETE',
                `repos/${this.getUsername()}/${this.getRepositoryName()}/contents/${remoteFilePath}`,
                {
                    message: `Added ${remoteFilePath}`
                }
            ];
        });

        return sequential(fileRequests, this.fileRequest, 1000, onUpdate);
    };

    uploadFiles = async (filePaths = [], basePath = '', onUpdate?) => {
        if (!filePaths.length) return;

        const fileRequests = filePaths.map(filePath => {
            const normalizedBasePath = slash(basePath);
            const normalizedFilePath = slash(filePath);
            const remoteFilePath = normalizedFilePath.replace(
                normalizedBasePath + '/',
                ''
            );

            return [
                'PUT',
                `repos/${this.getUsername()}/${this.getRepositoryName()}/contents/${remoteFilePath}`,
                {
                    message: `Added ${remoteFilePath}`,
                    content: btoa(fs.readFileSync(filePath, 'utf8'))
                }
            ];
        });

        return sequential(fileRequests, this.fileRequest, 1000, onUpdate);
    };

    /**
     * Adds SHA when file already exists
     */
    fileRequest = async (method, endpoint, data = {} as any, headers = {}) => {
        /**
         * Check if file is already uploaded
         */
        const existingFile = await this.request('GET', endpoint);

        if (existingFile && existingFile.sha) {
            /**
             * If content is the same, skip
             */
            if (
                JSON.stringify(`"${atob(existingFile.content)}"`) ===
                JSON.stringify(`"${atob(data.content)}"`)
            ) {
                return Promise.resolve({ content: existingFile });
            }

            data = {
                ...data,
                message:
                    method === 'DELETE'
                        ? 'Deleted'
                        : data.message.replace('Added', 'Updated'),
                sha: existingFile.sha
            };
        }

        return this.request(method, endpoint, data, headers);
    };

    createFile = async (path: string, content = '') => {
        return this.fileRequest(
            'PUT',
            `repos/${this.getUsername()}/${this.getRepositoryName()}/contents/${path}`,
            {
                message: `Added ${path}`,
                content: btoa(content)
            }
        );
    };

    createRepo = async () => {
        const repo = await this.getRepo();

        if (repo) {
            const confirmationRes = await confirmation({
                title:
                    'The repository already exists. Do you want to use it? (Contents will be removed)'
            });

            if (confirmationRes !== 0) {
                error(getString('action_cancelled'));
                return false;
            } else {
                return true;
            }
        }

        const { created_at } =
            (await this.request('POST', 'user/repos', {
                name: this.getRepositoryName(),
                description: getString('created_with'),
                homepage: getString('prss_domain'),
                auto_init: true
            })) || {};

        if (!created_at) {
            error(getString('error_repo_creation'));
            return false;
        }

        return true;
    };

    getRepo = async () => {
        const repos =
            (await this.request('GET', `users/${this.getUsername()}/repos`)) ||
            [];

        if (!Array.isArray(repos)) {
            error();
            return false;
        }

        const repo = repos.find(item => item.name === this.getRepositoryName());
        return repo;
    };

    request: requestType = async (
        method,
        endpoint,
        data = {},
        headers = {}
    ) => {
        const url = `https://${this.vars.baseApiUrl()}/${endpoint}`;
        const { hosting } = getInt(`sites.${this.site.id}`);
        const { name, username } = hosting;
        const password = await keychainRetreive(name, username);

        return axios({
            method,
            url,
            auth: { username, password },
            data,
            headers
        })
            .then(response => response.data)
            .catch(res => res);
    };
}

export default GithubProvider;
