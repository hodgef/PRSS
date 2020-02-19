import axios from 'axios';
import { error } from '../utils';

class Github {
    private readonly site: ISite;
    public readonly vars = {
        baseApiUrl: () => `https://api.github.com/users/${this.site.hosting.username}/`
    };
    public static hostingTypeDef = {
        title: "Github",
        fields: [
            {name: 'username', title: "Github Username", type: "text"},
            {name: 'token', title: "Github Token", type: "password"},
        ]
    };

    constructor(site: ISite){
        this.site = site;
    }

    setup = async () => {
        const { } = this.site;
        /**
         * Creating repo
         */
        console.log("site", this.site);

        await this.createRepo();
    }

    createRepo = async () => {
        const repo = await this.getRepo();

        if(repo){
            error(`A Github repository with this name (${repo.full_name}) already exists. Please choose another title for your blog.`);
            return;
        }

        console.log("Repo doesn't exist :)", repo)
    }

    getRepo = async () => {
        const repos = await this.request('GET', 'repos') || [];

        if(!Array.isArray(repos)){
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