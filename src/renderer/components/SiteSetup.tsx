import "./styles/SiteSetup.css";

import React, {
  Fragment,
  FunctionComponent,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useHistory, useParams } from "react-router-dom";
import cx from "classnames";

import { getString, configGet, configSet, configRem } from "../../common/utils";
import {
  handleHostingFields,
  getHostingTypes,
  validateHostingFields,
  setSiteConfig,
  setupRemote,
} from "../services/hosting";
import { toast } from "react-toastify";
import Loading from "./Loading";
import {
  getSite,
  createSite,
  createItems,
  deleteSite,
  deleteAllSiteItems,
} from "../services/db";
import ghImage from "../images/gh-mark.png";
import { setHook, getApiUrl } from "../../common/bootstrap";
import SiteSetupGithub from "./SiteSetupGithub";
import { error, normalizeStrict } from "../services/utils";
import {
  getSampleSiteStructure,
  getSampleSiteIntStructure,
} from "../services/site";

interface IProps {
  setHeaderLeftComponent: (comp?: ReactNode) => void;
  setAppClass: (v?) => void;
}

const SiteSetup: FunctionComponent<IProps> = ({
  setAppClass,
  setHeaderLeftComponent,
}) => {
  const { siteId } = useParams() as any;

  const sites = configGet("sites");
  const hasSites = !!(Object.keys(sites) && Object.keys(sites).length);
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(null);
  const hostingTypes = getHostingTypes();
  const [loadingStatus, setLoadingStatus] = useState("");

  // Default to "none" hosting
  const [hostingFields, setHostingFields] = useState(hasSites ? null : {
    name: "none",
  });
  const [extraHostingFields, setExtraHostingFields] = useState(null);

  const history = useHistory();
  const [title, setTitle] = useState(site ? site.title : "");

  useEffect(() => {
    setAppClass("app-site-setup");
    if (!siteId && !hasSites) {
      setHeaderLeftComponent(/*
                <Fragment>
                    <div className="align-center">
                        <a onClick={() => {}}>Welcome</a>
                    </div>
                </Fragment>
            */);
    } else {
      if (!site) {
        return;
      }

      setHeaderLeftComponent(
        <Fragment>
          <div className="align-center">
            <i className="material-icons">public</i>
            <a onClick={() => history.push(`/sites/${siteId}`)}>
              {site ? site.title : ""}
            </a>
          </div>
          <div className="align-center">
            <i className="material-icons">keyboard_arrow_right</i>
            <a onClick={() => history.push(`/sites/${siteId}/hosting`)}>
              Change hosting
            </a>
          </div>
        </Fragment>
      );
    }
  }, [site]);

  useEffect(() => {
    const getData = async () => {
      if (siteId) {
        const res = await getSite(siteId);
        setSite(res);
        setTitle(res.title);
      }
    };
    getData();
  }, []);

  useEffect(() => {
    setHook("github_login_success", async ({ token, username }) => {
      toast.success("Login Success");

      /**
       * Saving GitHub token
       */
      const parsedHostingFields = await handleHostingFields({
        name: "github",
        username,
        token,
      });

      setHostingFields(parsedHostingFields);
    });
  }, []);

  const features = [
    {
      id: "github",
      title: (
        <Fragment>
          GitHub
          {/*<span className="material-icons mb-2 mb-1" title="Recommended">
                        check_circle
            </span>*/}
        </Fragment>
      ),
      description: (
        <ul>
          <li>Github Pages Setup</li>
          <li>Automated Deployments</li>
        </ul>
      ),
      image: ghImage,
      className: "",
      tooltip: "",
      onClick: () => {
        window.open(getApiUrl("auth/github/authorize"));
      },
    },
    {
      id: "none",
      title: "None",
      description: (
        <ul>
          <li>Self-Host</li>
          <li>Manual Deployments</li>
        </ul>
      ),
      icon: "highlight_off",
      className: "",
      tooltip: "",
      onClick: async () => {
        setHostingFields({
          name: "none",
        });
      },
    },
  ];

  const handleSubmit = async () => {
    if (!title) {
      error("Your site must have a title");
      return;
    }

    const parsedHosting = (await handleHostingFields({
      ...hostingFields,
      ...extraHostingFields,
    })) as IHosting;

    console.log(
      "parsedHosting",
      parsedHosting,
      hostingFields,
      hostingTypes,
      hostingTypes[parsedHosting.name]
    );

    const isValid = validateHostingFields(
      hostingFields,
      hostingTypes[parsedHosting.name].fields
    );

    if (!isValid) {
      error(getString("error_fill_fields"));
      return;
    }

    console.log("Validation passed");

    setLoading(true);
    setAppClass("");

    if (!siteId) {
      /**
       * CREATING SITE
       */
      const siteName = normalizeStrict(title);

      const { site: siteStructure, items: siteItems } =
        getSampleSiteStructure();
      const siteUUID = siteStructure.uuid;

      const baseSiteDB = {
        ...siteStructure,
        name: siteName,
        title,
      } as ISite;

      const baseSiteConfig = {
        ...getSampleSiteIntStructure(),
        uuid: siteStructure.uuid,
        name: siteName,
        hosting: parsedHosting,
      } as ISiteInternal;

      /**
       * Save site in config
       */
      await setSiteConfig(baseSiteConfig);

      /**
       * Save site in db
       */
      await createSite(baseSiteDB);

      /**
       * Save site items in db
       */
      await createItems(siteItems);

      /**
       * Set up remote
       */
      const setupRes = await setupRemote(siteUUID, setLoadingStatus);
      if (!setupRes) {
        setLoading(false);

        /**
         * Rollback siteInt changes
         */
        await configRem(`sites.${siteUUID}`);
        await deleteSite(siteUUID);
        await deleteAllSiteItems(siteUUID);
        return;
      }

      /**
       * Go to site preview
       */
      history.push(`/sites/${siteUUID}`);
    } else {
      const siteInt = await configGet(`sites.${siteId}`);

      const baseSiteInternal = {
        ...siteInt,
        hosting: parsedHosting,
      } as ISiteInternal;

      await configSet(`sites.${siteId}`, baseSiteInternal);

      /**
       * Set up remote
       */
      const newSite = await setupRemote(siteId, setLoadingStatus);
      if (!newSite) {
        setLoading(false);

        /**
         * Rollback siteInt changes
         */
        await configSet(`sites.${siteId}`, siteInt);

        return;
      }

      toast.success("Hosting saved!");

      /**
       * Go to site preview
       */
      history.push(`/sites/${siteId}/settings`);
    }
  };

  if (loading) {
    return <Loading title={loadingStatus} />;
  }

  return (
    <div className="SiteSetup page">
      <div className="content">
        {!hostingFields ? (
          <section>
            <div className="content-header full-size mb-5">
              <h1>
                <div className="left-align">
                  {hasSites && (
                    <i
                      className="material-icons clickable"
                      onClick={() => history.push("/sites")}
                    >
                      arrow_back
                    </i>
                  )}
                  <span>Welcome</span>
                </div>
              </h1>
              <div className="sites-intro">
                <div className="image-label">
                  <h2>
                    {siteId
                      ? "Change your site hosting"
                      : "Choose a host for your site"}
                  </h2>
                </div>
              </div>
            </div>
            <div className="items">
              <ul>
                {features.map((item, index) => {
                  const {
                    id,
                    title,
                    description,
                    icon,
                    image,
                    //disabled,
                    onClick = () => {},
                    className = "",
                    tooltip,
                  } = item;
                  return (
                    <li
                      key={`${title}-${index}`}
                      className={cx(className, "clickable", {
                        //disabled
                      })}
                      onClick={onClick}
                      title={tooltip}
                    >
                      {loading === id ? (
                        <Loading medium classNames="mr-1" />
                      ) : (
                        <div className="image-cnt">
                          {image ? (
                            <img src={image} />
                          ) : (
                            <i className="material-icons">{icon}</i>
                          )}
                        </div>
                      )}
                      <div className="desc-container">
                        <div className="feature-title">{title}</div>
                        <div className="feature-description">{description}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        ) : (
          <section>
            <div className="content-header full-size mb-5">
              <h1>
                <div className="left-align">
                  {hasSites && (
                    <i
                      className="material-icons clickable"
                      onClick={() => history.push("/sites")}
                    >
                      arrow_back
                    </i>
                  )}
                  <span>{hasSites ? "Last step" : "Welcome"}</span>
                </div>
              </h1>
              <div className="sites-intro">
                <div className="image-label">
                  <h2>Choose a name for your site</h2>
                </div>
              </div>
            </div>
            {hostingFields.name === "github" && (
                <div className="alert alert-warning" role="alert">
                  Hello {hostingFields.username}! Before proceeding, please make sure you have <a href="https://docs.github.com/en/get-started/getting-started-with-git/set-up-git#setting-up-git" target="_blank">setup Git</a> and <b>that you can access</b> (pull, push) your GitHub repositories locally via Git.
                </div>
              )}
            <div className="input-group input-group-lg">
              <input
                type="text"
                placeholder="Site Title"
                className="form-control mb-3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            {hostingFields.name === "github" && (
              <SiteSetupGithub onChange={setExtraHostingFields} />
            )}

            <div className="button-container mt-3">
              <button
                onClick={() => handleSubmit()}
                type="button"
                className="btn btn-primary btn-lg"
              >
                {siteId ? "Save Changes" : "Create Site"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SiteSetup;
