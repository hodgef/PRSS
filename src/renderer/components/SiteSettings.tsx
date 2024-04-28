import "./styles/SiteSettings.css";

import React, {
  FunctionComponent,
  Fragment,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useHistory, useParams } from "react-router-dom";

import { normalizeStrict, appendSlash } from "../services/utils";
import { toast } from "react-toastify";
import HTMLEditorOverlay from "./HTMLEditorOverlay";
import { modal } from "./Modal";
import { getThemeList } from "../services/theme";
import SiteVariablesEditorOverlay from "./SiteVariablesEditorOverlay";
import { configGet, configSet } from "../../common/utils";
import { getSite, updateSite } from "../services/db";
import { shell } from "electron";
import path from "path";
import fs from "fs";
import { runHook, storeInt } from "../../common/bootstrap";
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Col from 'react-bootstrap/Col';
import { ISite, ISiteInternal } from "../../common/interfaces";

interface IProps {
  setHeaderLeftComponent: (comp?: ReactNode) => void;
}

const SiteSettings: FunctionComponent<IProps> = ({
  setHeaderLeftComponent,
}) => {
  const { siteId } = useParams() as any;

  const siteInt = configGet(`sites.${siteId}`) as ISiteInternal;
  const {
    hosting: { name: hostingName = "none" },
  } = siteInt;

  const [site, setSite] = useState<ISite>(null);
  const { title, headHtml, footerHtml, sidebarHtml, url: resSiteUrl } = site || {};

  const [siteTitle, setSiteTitle] = useState("");
  const [editedSiteName, setEditedSiteName] = useState("");
  const [siteTheme, setSiteTheme] = useState("");
  const [siteUrl, setSiteUrl] = useState("");

  const [themeList, setThemeList] = useState(null);
  const history = useHistory();

  useEffect(() => {
    if (!title) {
      return;
    }
    setHeaderLeftComponent(
      <Fragment>
        <div className="align-center">
          <i className="material-symbols-outlined">public</i>
          <a onClick={() => history.push(`/sites/${siteId}`)}>{title}</a>
        </div>
        <div className="align-center">
          <i className="material-symbols-outlined">keyboard_arrow_right</i>
          <a onClick={() => history.push(`/sites/${siteId}/settings`)}>
            Settings
          </a>
        </div>
      </Fragment>
    );
  }, [title]);

  useEffect(() => {
    const getData = async () => {
      const siteRes = await getSite(siteId);
      const { title, name, theme, url } = (siteRes) || {};
      setSite(siteRes);
      setSiteTitle(title);
      setEditedSiteName(name);
      setSiteTheme(theme);
      setSiteUrl(url);

      setThemeList(await getThemeList());
    };
    getData();
  }, []);

  const setShowRawHTMLEditorOverlay = useCallback(() => {
    runHook("HTMLEditorOverlay_setVariables", {
      headHtml: site.headHtml,
      footerHtml: site.footerHtml,
      sidebarHtml: site.sidebarHtml
    });
  }, [site]);

  const setShowSiteVariablesEditorOverlay = useCallback(() => {
    runHook("SiteVariablesEditorOverlay_show");
  }, []);

  const handleVariablesOverlaySave = useCallback(() => {
    toast.success("Post updated");
  }, []);

  if (!site || !themeList) {
    return null;
  }

  const openPublicDir = async () => {
    const { name: siteName } = site;
    const publicDir = path.join(storeInt.get("paths.public"), siteName);

    if (fs.existsSync(publicDir)) {
      shell.openPath(publicDir);
    } else {
      modal.alert(["site_cfg_dir_prev", []]);
    }
  };

  const handleSubmit = async () => {
    if (!editedSiteName) {
      modal.alert(["site_cfg_id_missing", []]);
      return;
    }

    if (!siteTitle) {
      modal.alert(["site_cfg_title_missing", []]);
      return;
    }

    if (!siteTheme) {
      modal.alert(["site_cfg_theme_missing", []]);
      return;
    }

    if (!siteUrl && resSiteUrl) {
      modal.alert(["site_cfg_url_missing", []]);
      return;
    }

    const updatedAt = Date.now();
    const newSiteName = normalizeStrict(editedSiteName);

    const updatedSite = {
      ...site,
      name: newSiteName,
      title: siteTitle,
      theme: siteTheme,
      url: siteUrl,
      updatedAt,
    };

    const updatedSiteInt = {
      ...siteInt,
      publishSuggested: true,
    };

    /**
     * Update site updatedAt
     */
    await updateSite(siteId, {
      name: newSiteName,
      title: siteTitle,
      theme: siteTheme,
      url: siteUrl,
      updatedAt,
    });

    await configSet(`sites.${siteId}`, updatedSiteInt);

    setSite(updatedSite);

    toast.success(
      "Site updated! Please publish your changes from your Dashboard"
    );
  };

  const handleRawHTMLOverlaySave = async (
    headHtml,
    footerHtml,
    sidebarHtml
  ) => {
    if (siteId) {
      const updatedAt = Date.now();

      const updatedSite = {
        ...site,
        headHtml,
        footerHtml,
        sidebarHtml,
        updatedAt,
      };

      /**
       *  Update item
       */
      await updateSite(siteId, {
        headHtml,
        footerHtml,
        sidebarHtml,
        updatedAt,
      });

      await configSet(`sites.${siteId}.publishSuggested`, true);

      setSite(updatedSite);

      toast.success(
        "Site updated! Please publish your changes from your Dashboard"
      );
    }
  };

  return (
    <div className="SiteSettings page">
      <h1>
        <div className="left-align">
          <i
            className="material-symbols-outlined clickable"
            onClick={() => history.goBack()}
          >
            arrow_back
          </i>
          <span>Site Settings</span>
        </div>
        <div className="right-align">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSubmit()}
          >
            <span className="material-symbols-outlined mr-2">save</span>
            <span>Save Changes</span>
          </button>
        </div>
      </h1>
      <div className="content">
        <Form>
          <Form.Group className="form-group row">
            <InputGroup className="input-group-lg">
              <Form.Label className="col-sm-2 col-form-label">Site ID</Form.Label>
              <Col className="col-sm-10">
                <Form.Control type="text" className="form-control" value={siteId} disabled />
              </Col>
            </InputGroup>
          </Form.Group>
          <div className="form-group row">
            <div className="input-group input-group-lg">
              <label className="col-sm-2 col-form-label">Site Title</label>
              <div className="col-sm-10">
                <input
                  type="text"
                  className="form-control"
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="form-group row">
            <div className="input-group input-group-lg">
              <label className="col-sm-2 col-form-label">Site Name</label>
              <div className="col-sm-10">
                <input
                  type="text"
                  className="form-control"
                  value={editedSiteName}
                  onChange={(e) => setEditedSiteName(e.target.value)}
                  onBlur={() =>
                    setEditedSiteName(normalizeStrict(editedSiteName))
                  }
                />
              </div>
            </div>
          </div>
          <div className="form-group row">
            <div className="input-group input-group-lg">
              <label className="col-sm-2 col-form-label">Site Theme</label>
              <div className="col-sm-10">
                <select
                  className="custom-select"
                  id="theme-selector"
                  onChange={(e) => setSiteTheme(e.target.value)}
                  value={siteTheme}
                >
                  {themeList.map((themeName) => (
                    <option key={`option-${themeName}`} value={themeName}>
                      {themeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="form-group row">
            <div className="input-group input-group-lg">
              <label className="col-sm-2 col-form-label">Site Url</label>
              <div className="col-sm-10">
                <input
                  type="text"
                  className="form-control"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  onBlur={(e) => setSiteUrl(appendSlash(e.target.value))}
                />
              </div>
            </div>
          </div>
          <div className="form-group row">
            <div className="input-group input-group-lg">
              <label className="col-sm-2 col-form-label">Site HTML</label>
              <div className="col-sm-10">
                <button
                  type="button"
                  className="btn btn-outline-primary d-flex"
                  onClick={() => setShowRawHTMLEditorOverlay()}
                >
                  <span className="material-symbols-outlined mr-2">code</span>
                  <span>Add Site Raw HTML</span>
                </button>
              </div>
            </div>
          </div>
          <div className="form-group row">
            <div className="input-group input-group-lg">
              <label className="col-sm-2 col-form-label">
                Hosting:{" "}
                {hostingName[0].toUpperCase() + hostingName.substring(1)}
              </label>
              <div className="col-sm-10">
                <button
                  type="button"
                  className="btn btn-outline-primary d-flex"
                  onClick={() => history.push(`/sites/${siteId}/hosting`)}
                >
                  <span className="material-symbols-outlined mr-2">language</span>
                  <span>Change hosting</span>
                </button>
              </div>
            </div>
          </div>
          <div className="form-group row">
            <div className="input-group input-group-lg">
              <label className="col-sm-2 col-form-label">Site Variables</label>
              <div className="col-sm-10">
                <button
                  type="button"
                  className="btn btn-outline-primary d-flex"
                  onClick={() => setShowSiteVariablesEditorOverlay()}
                >
                  <span className="material-symbols-outlined mr-2">create</span>
                  <span>Edit Variables</span>
                </button>
              </div>
            </div>
          </div>
          <div className="form-group row">
            <div className="input-group input-group-lg">
              <label className="col-sm-2 col-form-label">Public Folder</label>
              <div className="col-sm-10">
                <button
                  type="button"
                  className="btn btn-outline-primary d-flex"
                  onClick={() => openPublicDir()}
                >
                  <span className="material-symbols-outlined mr-2">folder</span>
                  <span>Open Public Dir</span>
                </button>
              </div>
            </div>
          </div>
        </Form>
      </div>
      <SiteVariablesEditorOverlay site={site} onSave={handleVariablesOverlaySave} />
      <HTMLEditorOverlay onSave={handleRawHTMLOverlaySave} />
    </div>
  );
};

export default SiteSettings;
