import { updateSite } from "./../db";
import {
  localStorageGet,
  configGet,
  runCommand,
} from "./../../../common/utils";
import axios from "axios";
import fs from "fs";
import path from "path";
import slash from "slash";
import del from "del";

import { getString } from "../../../common/utils";
import {
  bufferPathFileNames,
  build,
  configFileName,
  getFilteredBufferItems,
  clearBuffer,
} from "../build";
import { confirmation } from "../utils";
import { sequential } from "./../utils";
import { modal } from "../../components/Modal";
import { getSite } from "../db";
import { storeInt } from "../../../common/bootstrap";
import { requestType } from "../../../common/interfaces";

class GithubProvider {
  private readonly siteUUID: string;
  public readonly vars = {
    baseUrl: () => "github.com",
    baseApiUrl: () => "api.github.com",
  };
  public static hostingTypeDef = {
    title: "Github",
    fields: [
      {
        name: "repository",
        optional: true,
      },
    ],
  };

  constructor(siteUUID: string) {
    this.siteUUID = siteUUID;
  }

  fetchSite = () => {
    return getSite(this.siteUUID);
  };

  fetchSiteConfig = () => {
    return configGet(`sites.${this.siteUUID}`);
  };

  setup = async (onUpdate) => {
    /**
     * Creating repo
     */
    const { hosting } = this.fetchSiteConfig();
    const username = await this.getUsername();
    let createdRepoRes;

    if (username === hosting.username) {
      onUpdate(getString("creating_repository"));
      createdRepoRes = await this.createRepo();

      if (!createdRepoRes) return false;
    }

    /**
     * Deploy project to set up repo's master branch
     */
    await this.deploy(
      onUpdate,
      null,
      true,
      false,
      "Preparing",
      "Initial Commit"
    );

    /**
     * Enabling pages site
     */
    const siteUrl = await this.enablePagesSite(createdRepoRes);

    if (!siteUrl) {
      if (!modal.isShown()) {
        modal.alert(["error_setup_remote", []]);
      }
      return false;
    }

    /**
     * Save site url
     */
    await updateSite(this.siteUUID, {
      url: siteUrl,
    });

    /**
     * Deploy project (for real this time)
     */
    await this.deploy(onUpdate, null, true, false);
    return true;
  };

  getUsername = () => {
    const { hosting } = this.fetchSiteConfig();
    const { username, repository } = hosting;

    if (repository && repository.includes("/")) {
      return repository.split("/")[0];
    } else {
      return username;
    }
  };

  getRepositoryName = () => {
    const {
      name,
      hosting: { repository },
    } = this.fetchSiteConfig();

    if (repository) {
      if (repository.includes("/")) {
        return repository.split("/")[1];
      } else {
        return repository;
      }
    } else {
      return name;
    }
  };

  getRepositoryUrl = async () => {
    const repositoryName = await this.getRepositoryName();
    const username = await this.getUsername();
    if(repositoryName && username){
      return `https://${this.vars.baseUrl()}/${username}/${repositoryName}`;
    } else {
      return "";
    }
  };

  /**
   * Hacky workaround until GitHub fixes Pages API
   * https://github.community/t/cannot-enable-github-pages-via-api-blank-500-error/124406/6
   */
  prepareForFirstDeployment = async () => {
    return new Promise(async (resolve) => {
      const bufferDir = storeInt.get("paths.buffer");
      const username = await this.getUsername();
      const repositoryName = await this.getRepositoryName();
      const repositoryUrl = await this.getRepositoryUrl();

      /**
       * Clearing buffer
       */
      await clearBuffer(true);

      /**
       * Creating gh-pages branch
       */
      runCommand(bufferDir, `git clone "${repositoryUrl}" .`);
      runCommand(bufferDir, "git branch gh-pages");
      runCommand(bufferDir, "git checkout gh-pages");
      runCommand(bufferDir, "git config --global core.safecrlf false");
      runCommand(bufferDir, `echo "${repositoryName}" > README.md`);
      runCommand(bufferDir, "git add --all");
      runCommand(bufferDir, 'git commit -m "Initial commit"');
      const { error: ghPagesErrCreation } = runCommand(
        bufferDir,
        "git push -u origin gh-pages"
      );

      if (!ghPagesErrCreation) {
        resolve(`https://${username}.github.io/${repositoryName}/`);
      } else {
        resolve("");
      }
    });
  };

  deploy = async (
    onUpdate = (s) => {},
    itemIdToDeploy?,
    clearRemote?,
    generateSiteMap = true,
    deployText = "Deploying",
    commitMessage = "Build update"
  ) => {
    const repositoryUrl = await this.getRepositoryUrl();
    const bufferDir = storeInt.get("paths.buffer");

    /**
     * Clearing buffer
     */
    await clearBuffer(true);

    /**
     * Creating git repo in buffer
     */
    try {
      const bufferDir = storeInt.get("paths.buffer");
      const cloneRes = runCommand(bufferDir, `git clone "${repositoryUrl}" .`);

      if (cloneRes.error) {
        modal.alert(cloneRes.res.message, null, null, null, `deploy_clone_error: ${repositoryUrl}`);
        console.error(cloneRes);
        return;
      }

      console.log("repositoryUrl", repositoryUrl);
      console.log("bufferDir", bufferDir);

      const buildRes = await build(
        this.siteUUID,
        onUpdate,
        itemIdToDeploy,
        !clearRemote,
        generateSiteMap,
        "deploy"
      );

      if (!buildRes) {
        modal.alert(["error_buffer", [repositoryUrl]]);
        return false;
      }

      onUpdate(deployText);

      await new Promise((resolve) => {
        setTimeout(() => {
          [
            runCommand(bufferDir, "git config --global core.safecrlf false"),
            runCommand(bufferDir, "git add --all"),
            runCommand(bufferDir, `git commit -m "${commitMessage}"`),
            runCommand(bufferDir, "git push --force")
          ].forEach((data) => {
            // If working space is empty, git commit exits with "1"
            if (data.error && !data.res.message?.includes("git commit")) {
              modal.alert(data.res.message, null, null, null, `commit_error: ${repositoryUrl}`);
              console.error(data);
            }
          });
          resolve(null);
        }, 1000);
      });
    } catch (e) {
      modal.alert(e.message, null, null, null, `deploy_error: ${repositoryUrl}`);
      console.error(e);
    }

    // TODO: Re-enable if it's needed
    // await clearBuffer(true);
    await del([path.join(bufferDir, ".git")], { force: true });

    return true;
  };

  deployWithAPI = async (onUpdate?, itemIdToDeploy?) => {
    const { itemsToLoad } = await getFilteredBufferItems(
      this.siteUUID,
      itemIdToDeploy
    );

    const bufferDir = storeInt.get("paths.buffer");

    const siteConfigFilePath = path.join(bufferDir, configFileName);

    const bufferFilePaths = [siteConfigFilePath];

    itemsToLoad.forEach((item) => {
      const baseFilePath = path.join(bufferDir, item.path);

      bufferPathFileNames.forEach((bufferPathFileName) => {
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

    return this.uploadFiles(bufferFilePaths, bufferDir, (progress) => {
      onUpdate && onUpdate(getString("deploying_progress", [progress]));
    });
  };

  /**
   * This uses git, as deleting files one by one through the API
   * will probably deplete the request quota
   */
  wipe = async (onUpdate?) => {
    const repoUrl = await this.getRepositoryUrl();
    const confirmationRes = await confirmation({
      title: `This operation requires clearing all files in "${repoUrl}". Continue?`,
    });

    if (confirmationRes !== 0) {
      modal.alert(["action_cancelled", [repoUrl]]);
      return false;
    }

    onUpdate && onUpdate("Clearing remote");

    /**
     * Clearing buffer
     */
    await clearBuffer();

    /**
     * Creating git repo in buffer
     */
    try {
      const bufferDir = storeInt.get("paths.buffer");
      runCommand(bufferDir, `git clone "${repoUrl}" .`);

      if (bufferDir && bufferDir.includes("buffer")) {
        await del([path.join(bufferDir, "*"), "!.git"], {
          force: true,
        });
      }

      runCommand(
        bufferDir,
        'git add --all && git commit -m "Clearing for deployment" && git push'
      );
    } catch (e) {
      modal.alert(e.message);
      console.error(e);
    }

    await clearBuffer();
    return true;
  };

  enablePagesSite = async (repo: any) => {
    if(!repo){
      modal.alert(["enable_pages_error", []]);
      return;
    }

    if(!repo.default_branch){
      modal.alert(["enable_pages_branch_error", []]);
      return;
    }

    const repositoryName = await this.getRepositoryName();
    const username = await this.getUsername();

    const endpoint = `repos/${username}/${repositoryName}/pages`;
    const existingSite = await this.request("GET", endpoint);

    if (existingSite && existingSite.html_url) {
      return existingSite.html_url;
    }

    const { html_url } =
      (await this.request(
        "POST",
        endpoint,
        {
          source: {
            branch: repo.default_branch,
            directory: "/",
          },
        },
        { Accept: "application/vnd.github.switcheroo-preview+json" }
      )) || {};

    return html_url;
  };

  deleteFiles = async (filePaths = [], basePath = "", onUpdate?) => {
    if (!filePaths.length) return;

    const repositoryName = await this.getRepositoryName();
    const username = await this.getUsername();

    const fileRequests = filePaths.map((filePath) => {
      const normalizedBasePath = slash(basePath);
      const normalizedFilePath = slash(filePath);
      const remoteFilePath = normalizedFilePath.replace(
        normalizedBasePath + "/",
        ""
      );

      return [
        "DELETE",
        `repos/${username}/${repositoryName}/contents/${remoteFilePath}`,
        {
          message: `Added ${remoteFilePath}`,
        },
      ];
    });

    return sequential(fileRequests, this.fileRequest, 1000, onUpdate);
  };

  uploadFiles = async (filePaths = [], basePath = "", onUpdate?) => {
    if (!filePaths.length) return;

    const repositoryName = await this.getRepositoryName();
    const username = await this.getUsername();

    const fileRequests = filePaths.map((filePath) => {
      const normalizedBasePath = slash(basePath);
      const normalizedFilePath = slash(filePath);
      const remoteFilePath = normalizedFilePath.replace(
        normalizedBasePath + "/",
        ""
      );

      return [
        "PUT",
        `repos/${username}/${repositoryName}/contents/${remoteFilePath}`,
        {
          message: `Added ${remoteFilePath}`,
          content: btoa(fs.readFileSync(filePath, "utf8")),
        },
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
    const existingFile = await this.request("GET", endpoint);

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
          method === "DELETE"
            ? "Deleted"
            : data.message.replace("Added", "Updated"),
        sha: existingFile.sha,
      };
    }

    return this.request(method, endpoint, data, headers);
  };

  createFile = async (path: string, content = "") => {
    const repositoryName = await this.getRepositoryName();
    const username = await this.getUsername();

    return this.fileRequest(
      "PUT",
      `repos/${username}/${repositoryName}/contents/${path}`,
      {
        message: `Added ${path}`,
        content: btoa(content),
      }
    );
  };

  createRepo = async () => {
    const repo = await this.getRepo();
    const repoUrl = await this.getRepositoryUrl();

    if (repo) {
      const confirmationRes = await confirmation({
        title:
          "The repository already exists. Do you want to use it? (Contents will be removed)",
      });

      if (confirmationRes !== 0) {
        modal.alert(["action_cancelled", [repoUrl]]);
        return false;
      } else {
        return repo;
      }
    }

    const repositoryName = await this.getRepositoryName();

    const res =
      (await this.request("POST", "user/repos", {
        name: repositoryName,
        description: getString("created_with"),
        homepage: getString("prss_domain"),
        auto_init: true,
      })) || {};

    if (!res?.created_at) {
      modal.alert(["error_repo_creation", [repoUrl]]);
      return false;
    }

    return res;
  };

  getRepo = async () => {
    const username = await this.getUsername();
    const requestUrl = `users/${username}/repos`;

    const repos = (await this.request("GET", `users/${username}/repos`)) || [];

    if (!Array.isArray(repos)) {
      modal.alert(["error_occurred", [requestUrl]]);
      return false;
    }

    const repositoryName = await this.getRepositoryName();
    const repo = repos.find((item) => item.name === repositoryName);
    return repo;
  };

  request: requestType = async (method, endpoint, data = {}, headers) => {
    const url = `https://${this.vars.baseApiUrl()}/${endpoint}`;
    const { hosting } = configGet(`sites.${this.siteUUID}`);
    const { name, username } = hosting;
    const token = await localStorageGet(`${name}:${username}`);

    return axios({
      method,
      url,
      auth: { username, password: token },
      data,
      headers: headers || {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28"
      },
    })
      .then((response) => response.data)
      .catch((res) => res);
  };
}

export default GithubProvider;
