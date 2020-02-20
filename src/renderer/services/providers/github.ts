import axios from 'axios';

import { error, getString } from '../utils';

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
        const { } = this.site;
        /**
         * Creating repo
         */
        console.log('site', this.site);

        updates(getString('creating_repository'));
        return false;
        await this.createRepo();
    }

    createRepo = async () => {
        const repo = await this.getRepo();

        if (repo) {
            error(
                getString('error_repo_exists', [
                    Github.hostingTypeDef.title,
                    repo.full_name,
                    this.site.type
                ])
            );
            return;
        }

        const { clone_url } = await this.request('POST', 'user/repos', {
            name: this.site.id,
            description: getString('created_with'),
            homepage: getString('prss_domain'),
            auto_init: true
        }) || {};

        console.log('created_at', clone_url);

        if (!clone_url) {
            error(getString('error_repo_creation'));
            return;
        }

        console.log('Success!');
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

    request: IRequest = (method, endpoint, data = {}) => {
        const url = this.vars.baseApiUrl() + endpoint;
        return axios({
            method,
            url,
            auth: {
                username: this.site.hosting.username,
                password: this.site.hosting.token
            },
            data
        }).then(response => response.data);
    }
}

export default Github;