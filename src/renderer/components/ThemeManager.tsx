import "./styles/ThemeManager.css";

import React, {
  FunctionComponent,
  Fragment,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useHistory, useParams } from "react-router-dom";
import path from "path";
import fs from "fs";
import cx from "classnames";

import { confirmation } from "../services/utils";
import { toast } from "react-toastify";
import { modal } from "./Modal";
import { shell } from "electron";
import { getThemeListDetails } from "../services/theme";
import defaultThumbnail from "../images/defaultThemeThumbnail.png";
import { getSite, updateSite } from "../services/db";
import { configSet } from "../../common/utils";
import { prssConfig, storeInt } from "../../common/bootstrap";

interface IProps {
  setHeaderLeftComponent: (comp?: ReactNode) => void;
}

const ThemeManager: FunctionComponent<IProps> = ({
  setHeaderLeftComponent,
}) => {
  const { siteId } = useParams() as any;

  const [site, setSite] = useState(null);
  const { title } = (site as ISite) || {};

  const [siteTheme, setSiteTheme] = useState(null);
  const [themeList, setThemeList] = useState([]);

  useEffect(() => {
    if (!title) {
      return;
    }
    setHeaderLeftComponent(
      <Fragment>
        <div className="align-center">
          <i className="material-icons">public</i>
          <a onClick={() => history.push(`/sites/${siteId}`)}>{title}</a>
        </div>
        <div className="align-center">
          <i className="material-icons">keyboard_arrow_right</i>
          <a onClick={() => history.push(`/sites/${siteId}/themes`)}>Themes</a>
        </div>
      </Fragment>
    );
  }, [title]);

  useEffect(() => {
    const getData = async () => {
      const siteRes = await getSite(siteId);
      setSite(siteRes);
      setSiteTheme(siteRes.theme);
    };
    getData();
  }, []);

  const getThemes = async (noToast?) => {
    const themes = await getThemeListDetails();
    setThemeList(themes);

    if (!noToast) {
      toast.success("Theme list refreshed!");
    }

    const themesWithManifest = await getThemeListDetails(true);
    setThemeList(themesWithManifest);
  };

  useEffect(() => {
    getThemes(true);
  }, []);

  const history = useHistory();

  if (!site || !siteTheme) {
    return null;
  }

  const showThemeDetails = (theme) => {
    const authorFormatted =
      theme.author === "Francisco Hodge" ? "PRSS" : theme.author;

    modal.alert(
      <Fragment>
        <p>
          <strong>Author:</strong> {authorFormatted}
        </p>
        <p>
          <strong>Homepage:</strong>{" "}
          <a
            href={theme.homepage}
            target="_blank"
            title={theme.homepage}
            rel="noopener noreferrer"
          >
            {theme.homepage}
          </a>
        </p>
        <p>
          <strong>Parser:</strong> {theme.parser}
        </p>
        <p>
          <strong>License:</strong> {theme.license}
        </p>
      </Fragment>,
      `${theme.title} v${theme.version}`,
      "theme-details-content"
    );
  };

  const handleSubmit = async (themeName) => {
    if (!themeName) {
      modal.alert(["theme_mgr_reqtheme", []]);
      return;
    }

    const updatedAt = Date.now();
    setSiteTheme(themeName);

    const updatedSite = {
      ...site,
      theme: themeName,
      updatedAt,
    };

    await updateSite(siteId, {
      theme: themeName,
      updatedAt,
    });

    await configSet(`sites.${siteId}.publishSuggested`, true);

    setSite(updatedSite);

    toast.success(
      "Site updated! Please publish your changes from your Dashboard"
    );
  };

  const addTheme = async () => {
    const confirmationRes = await confirmation({
      title: (
        <Fragment>
          <p>The PRSS theme directory will be opened.</p>
          <p>You will need to add any theme files to that directory.</p>
          <p>
            Please ensure you get themes from trusted sources, such as the{" "}
            <a
              href="https://hodgef.com/prss/themes/"
              title="https://hodgef.com/prss/themes/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <u>PRSS Themes</u>
            </a>{" "}
            page.
          </p>
          <p>Continue?</p>
        </Fragment>
      ),
    });

    if (confirmationRes !== 0) {
      return;
    }

    const themesDir = storeInt.get("paths.themes");
    shell.openPath(themesDir);
  };

  return (
    <div className="ThemeManager page">
      <div className="content">
        <h1>
          <div className="left-align">
            <i
              className="material-icons clickable"
              onClick={() => history.goBack()}
            >
              arrow_back
            </i>
            <span>Themes</span>
          </div>
          <div className="right-align">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => getThemes()}
            >
              <i className="material-icons">refresh</i>
            </button>
          </div>
        </h1>

        <div className="theme-list">
          {themeList.map((theme) => {
            const { name, title, author, url, themeDir } = theme;
            let image = defaultThumbnail;

            const authorFormatted =
              author === "Francisco Hodge" ? "PRSS" : author;

            try {
              if (prssConfig.themes[name]) {
                image = prssConfig.themes[name] + "/thumbnail.png";
              } else {
                image =
                  "data:image/png;base64," +
                  fs.readFileSync(path.join(themeDir, "thumbnail.png"), {
                    encoding: "base64",
                  });
              }
            } catch (e) {
              console.error(e);
            }

            return (
              <div
                className={cx("theme-list-item", {
                  "selected-theme": name === siteTheme,
                })}
                key={`option-${name}`}
              >
                <div
                  onClick={() =>
                    name === siteTheme
                      ? showThemeDetails(theme)
                      : handleSubmit(name)
                  }
                  className="theme-list-item-image clickable"
                  style={{
                    backgroundImage: `url(${image})`,
                  }}
                ></div>
                <div className="theme-list-item-desc">
                  <div className="theme-name">
                    <div className="left-align">
                      <span>{title || name}</span>
                    </div>
                    <div className="right-align">
                      {authorFormatted && (
                        <span className="material-icons" title="Theme Info" onClick={() => showThemeDetails(theme)}>
                          info
                        </span>
                      )}
                    </div>
                  </div>
                  {authorFormatted && (
                    <div className="theme-author">
                      <div className="left-align">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={url}
                          >
                            by <b>{authorFormatted}</b>
                          </a>
                        ) : (
                          <span>by <b>{authorFormatted}</b></span>
                        )}
                        {authorFormatted === "PRSS" && (
                          <span className="badge badge-secondary ml-2">Official</span>
                        )}
                      </div>
                      <div className="right-align"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div
            className="theme-list-item add-new-theme-btn clickable"
            onClick={() => addTheme()}
          >
            <i className="material-icons">add_circle</i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeManager;
