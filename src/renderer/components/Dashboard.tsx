import "./styles/Dashboard.css";

import React, {
  Fragment,
  FunctionComponent,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useHistory, useParams } from "react-router-dom";
import cx from "classnames";

import { getString, configGet, configSet } from "../../common/utils";
import { buildAndDeploy, getRepositoryUrl } from "../services/hosting";
import { toast } from "react-toastify";
import Loading from "./Loading";
import { getSite } from "../services/db";
import { prssConfig } from "../../common/bootstrap";
import { getThemeManifest } from "../services/theme";
import { ISite, ISiteInternal } from "../../common/interfaces";

interface IProps {
  setHeaderLeftComponent: (comp?: ReactNode) => void;
}

const Dashboard: FunctionComponent<IProps> = ({ setHeaderLeftComponent }) => {
  const { siteId } = useParams() as any;

  const [site, setSite] = useState<ISite>(null);
  const [publishSuggested, setPublishSuggested] = useState(null);
  const [loading, setLoading] = useState(null);
  const [repositoryUrl, setRepositoryUrl] = useState(null);
  const [publishDescription, setPublishDescription] = useState(
    "Publish latest changes"
  );

  const history = useHistory();
  const { title, url } = site || {};

  useEffect(() => {
    if (!title) {
      return;
    }
    setHeaderLeftComponent(
      <Fragment>
        <div className="align-center">
          <i className="material-symbols-outlined">public</i>
          <span>{title}</span>
        </div>
      </Fragment>
    );
  }, [title]);

  useEffect(() => {
    const getData = async () => {
      const res = await getSite(siteId);
      const repositoryUrl = await getRepositoryUrl(siteId);
      const siteConf =
        ((await configGet(`sites.${siteId}`)) as ISiteInternal) ||
        ({} as never);

      setSite(res);
      setRepositoryUrl(repositoryUrl);
      setPublishSuggested(siteConf.publishSuggested);

      const theme = res.theme;

      /**
       * If official theme, fetch manifest
       */
      if (prssConfig.themes[theme]) {
        getThemeManifest(theme);
      }
    };
    getData();
  }, []);

  if (!site) {
    return null;
  }

  const features = [
    {
      id: "posts",
      title: getString("posts"),
      description: getString("posts_description"),
      icon: "layers",
      className: "",
      tooltip: "",
      onClick: () => {
        history.push({
          pathname: `/sites/${siteId}/posts`,
          state: { showBack: true },
        });
      },
    },
    {
      id: "themes",
      title: getString("themes"),
      description: getString("themes_description"),
      icon: "brush",
      className: "",
      tooltip: "",
      onClick: () => {
        history.push({
          pathname: `/sites/${siteId}/themes`,
          state: { showBack: true },
        });
      },
    },
    {
      id: "settings",
      title: getString("settings"),
      description: getString("settings_description"),
      icon: "settings",
      className: "",
      tooltip: "",
      onClick: () => {
        history.push({
          pathname: `/sites/${siteId}/settings`,
          state: { showBack: true },
        });
      },
    },
    {
      id: "menus",
      title: getString("menus"),
      description: getString("menus_description"),
      icon: "menu",
      className: "",
      tooltip: "",
      onClick: () => {
        history.push({
          pathname: `/sites/${siteId}/menus`,
          state: { showBack: true },
        });
      },
    },
  ];

  if (url) {
    features.push({
      id: "visit",
      title: getString("visit_site"),
      description: getString("visit_site_description"),
      icon: "language",
      className: "",
      tooltip: url,
      onClick: () => {
        require("electron").shell.openExternal(url);
      },
    });
  }

  if (repositoryUrl) {
    features.push({
      id: "repository",
      title: getString("repository"),
      description: getString("repository_description"),
      icon: "open_in_new",
      className: "",
      tooltip: repositoryUrl,
      onClick: () => {
        require("electron").shell.openExternal(repositoryUrl);
      },
    });
  }

  if (publishSuggested) {
    features.push({
      id: "publish",
      title: getString("publish"),
      description: publishDescription,
      className: "box-highlight",
      tooltip: "",
      icon: "publish",
      onClick: async () => {
        setLoading("publish");
        const publishRes = await buildAndDeploy(
          siteId,
          setPublishDescription,
          null,
          true
        );

        configSet(`sites.${siteId}.publishSuggested`, false);
        setPublishSuggested(false);

        toast.success("Publish complete");

        if (typeof publishRes === "object") {
          if (publishRes.type === "redirect") {
            history.push(publishRes.value);
          }
        }
        setLoading(null);
      },
    });
  }

  return (
    <div className="Dashboard page">
      <div className="content">
        <h1>
          <div className="left-align">
            <i
              className="material-symbols-outlined clickable"
              onClick={() => history.push("/sites")}
            >
              arrow_back
            </i>
            <span>Dashboard</span>
          </div>
        </h1>
        <div className="items">
          <ul>
            {features.map((item, index) => {
              const {
                id,
                title,
                description,
                icon,
                onClick = () => {},
                className = "",
                tooltip,
              } = item;
              return (
                <li
                  key={`${title}-${index}`}
                  className={cx(className, "clickable")}
                  onClick={onClick}
                  title={tooltip}
                >
                  {loading === id ? (
                    <Loading medium classNames="mr-1" />
                  ) : (
                    <i className="material-symbols-outlined">{icon}</i>
                  )}

                  <div className="feature-title">{title}</div>
                  <div className="feature-description">{description}</div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
