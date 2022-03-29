import React, { FunctionComponent, ReactNode, useState } from "react";
import { getString } from "../../common/utils";
import { modal } from "./Modal";

interface IProps {
  onChange: (v?) => void;
}

const SiteSetupGithub: FunctionComponent<IProps> = ({ onChange }) => {
  const [repo, setRepo] = useState("");
  const repoDescription = [
    React.createElement(
      "p",
      { key: "github-repo-info-1" },
      getString("github_repo_info_1")
    ),
    React.createElement("p", { key: "github-repo-info-1b" }, [
      React.createElement(
        "span",
        { key: "github-repo-info-1b-span" },
        "For Example: "
      ),
      React.createElement(
        "span",
        {
          className: "code-dark-inline",
          key: "github-repo-info-1b-span-2",
        },
        "myRepo"
      ),
    ]),
    React.createElement(
      "p",
      { key: "github-repo-info-2" },
      getString("github_repo_info_2")
    ),
    React.createElement("p", { key: "github-repo-info-2b" }, [
      React.createElement(
        "span",
        { key: "github-repo-info-2b-span" },
        "For Example: "
      ),
      React.createElement(
        "span",
        {
          className: "code-dark-inline",
          key: "github-repo-info-2b-span-2",
        },
        "username/repoName"
      ),
    ]),
    React.createElement(
      "p",
      { key: "github-repo-info-3" },
      getString("github_repo_info_3")
    ),
  ];

  return (
    <div className="site-setup-github">
      <div className="input-group input-group-lg">
        <input
          type="text"
          placeholder="Repository Name (optional)"
          className="form-control"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          onBlur={() => {
            onChange({
              repository: repo,
            });
          }}
        />
        <div
          className="description-icon clickable"
          onClick={() =>
            modal.alert(repoDescription, null, "hosting-field-desc")
          }
        >
          <span className="material-icons mr-2">info</span>
        </div>
      </div>
    </div>
  );
};

export default SiteSetupGithub;
