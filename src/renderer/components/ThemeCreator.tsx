import "./styles/ThemeCreator.css";

import React, {
  FunctionComponent,
  Fragment,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { useHistory, useParams } from "react-router-dom";
import path from "path";
import fs from "fs";

import { normalize } from "../services/utils";
import { toast } from "react-toastify";
import { shell } from "electron";
import { getSite } from "../services/db";
import { runCommand } from "../../common/utils";
import { prssConfig, storeInt } from "../../common/bootstrap";
import { ISite } from "../../common/interfaces";
import { Col, Form, InputGroup } from "react-bootstrap";
import Loading from "./Loading";
import { useProvider } from "./UseProvider";

interface IProps {
  setHeaderLeftComponent: (comp?: ReactNode) => void;
}

const ThemeCreator: FunctionComponent<IProps> = ({
  setHeaderLeftComponent,
}) => {
  const history = useHistory();
  const { siteId } = useParams() as any;
  const providerThemeList = useProvider<any[]>("providerThemeList");

  const [site, setSite] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("Loading Site");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { title } = (site as ISite) || {};

  const [themeName, setThemeName] = useState("");
  const [themeBase, setThemeBase] = useState("https://github.com/prss-io/slate-theme")
  const themeIdAppendix = useRef(uuidv4().substring(0, 5));
  const normalizedThemeName = normalize(themeName);
  const themeId = themeName?.trim() ? normalizedThemeName + (prssConfig.themes[normalizedThemeName] ? "-" + themeIdAppendix.current : "") : "";
  const parser = "react";

  const themeNameRef = useRef<HTMLInputElement>(null);
  const themeList = useRef<any[]>(providerThemeList.value || [{ name: "slate", title: "Slate", homepage: "https://github.com/prss-io/slate-theme" }]);

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
          <a onClick={() => history.push(`/sites/${siteId}/themes`)}>Themes</a>
        </div>
        <div className="align-center">
          <i className="material-symbols-outlined">keyboard_arrow_right</i>
          <a onClick={() => history.push(`/sites/${siteId}/themes/create`)}>Create Theme</a>
        </div>
      </Fragment>
    );
  }, [title]);

  useEffect(() => {
    const getData = async () => {
      const siteRes = await getSite(siteId);
      setSite(siteRes);
    };
    getData();
    
  }, []);

  useEffect(() => {
    if(themeNameRef.current){
      themeNameRef.current.onkeydown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          handleSubmit();
        }
      };
      themeNameRef.current.focus();
    }
  }, [themeName, site]);

  const handleSubmit = () => {
    if(!themeBase || !themeBase.includes("github.com/prss-io")){
      toast.error("Please provide a valid theme base");
      return;
    }

    if(!themeId){
      toast.error("Please provide a valid theme name");
      return;
    }

    const themesDir = storeInt.get("paths.themes");

    if(!themesDir){
      toast.error("Your themesDir is not set. Please restart PRSS");
      return;
    }

    setLoadingMessage(`Cloning Base Theme (${themeBase.split("/prss-io/")[1]})`);
    setIsLoading(true);

    setTimeout(() => {
      if(!fs.existsSync(path.join(themesDir, themeId))){
        runCommand(themesDir, `git clone "${themeBase}.git" ${themeId}`);
      }
  
      // Still not created?
      if(!fs.existsSync(path.join(themesDir, themeId))){
        toast.error("The base theme could not be cloned. Please check out the themes directory for any issues");
        return;
      }
  
      // /**
      //  * Delete git dir
      //  */
      // if (fs.existsSync(path.join(themesDir, themeId, ".git"))) {
      //   fs.rmdirSync(path.join(themesDir, themeId, ".git"), { recursive: true });
      // }
  
      // /**
      //  * Delete .github dir
      //  */
      //  if (fs.existsSync(path.join(themesDir, themeId, ".github"))) {
      //   fs.rmdirSync(path.join(themesDir, themeId, ".github"), { recursive: true });
      // }
  
      /**
       * Amend package.json
       */
      setLoadingMessage("Update metadata");
      const packageJson = JSON.parse(fs.readFileSync(path.join(themesDir, themeId, "package.json"), "utf-8"));
      
      if(!packageJson){
        toast.error("Could not find package.json. The theme was not cloned correctly.");
        return;
      }
  
      packageJson.name = themeId;
      packageJson.private = true;
      packageJson.version = "1.0.0";
      packageJson.description = "Local PRSS theme derived from @prss-io/slate-theme";
      packageJson.author = "User";
      delete packageJson.bugs;
      delete packageJson.keywords;
      delete packageJson.repository;
  
      /**
       * Amend public manifest
       */
      const manifestJsonPublic = JSON.parse(fs.readFileSync(path.join(themesDir, themeId, "public", "manifest.json"), "utf-8"));
      
      if(!manifestJsonPublic){
        toast.error("Could not find manifest.json. The theme was not cloned correctly.");
        return;
      }
  
      manifestJsonPublic.title = themeName;
      manifestJsonPublic.parser = parser;

      /**
       * Amend build manifest
       */
      const manifestJsonBuild = JSON.parse(fs.readFileSync(path.join(themesDir, themeId, "build", "manifest.json"), "utf-8"));
      
      if(!manifestJsonBuild){
        toast.error("Could not find manifest.json. The theme was not cloned correctly.");
        return;
      }
  
      manifestJsonBuild.name = themeId;
      manifestJsonBuild.title = themeName;
      manifestJsonBuild.parser = parser;
      manifestJsonBuild.author = "User";
      manifestJsonBuild.version = "1.0.0";
  
      /**
       * Replace image to default
       */
      const defaultThumbnailPath = path.join(themesDir, themeId, "build", "defaultThumbnail.png");
      if (defaultThumbnailPath){
        fs.renameSync(defaultThumbnailPath, path.join(themesDir, themeId, "build", "thumbnail.png"));
        fs.copyFileSync(path.join(themesDir, themeId, "build", "thumbnail.png"), path.join(themesDir, themeId, "public", "thumbnail.png"));
      }
  
      /**
       * Write package json
       */
      fs.writeFileSync(path.join(themesDir, themeId, "package.json"), JSON.stringify(packageJson, null, 2));
  
      /**
       * Write manifest.json
       */
      // Public
      fs.writeFileSync(path.join(themesDir, themeId, "public", "manifest.json"), JSON.stringify(manifestJsonPublic, null, 2));
      // Build
      fs.writeFileSync(path.join(themesDir, themeId, "build", "manifest.json"), JSON.stringify(manifestJsonBuild, null, 2));
  
      setIsLoading(false);
      history.replace(`/sites/${siteId}/themes`);
      
      toast.success("Theme created! You can now edit the theme project.");
      shell.openPath(path.join(themesDir, themeId));
    }, 1000);
  }

  if(!site || isLoading){
    return <Loading classNames="mr-1" title={loadingMessage} />
  }

  return (
    <div className="ThemeCreator page">
      <h1>
        <div className="left-align">
          <i
            className="material-symbols-outlined clickable"
            onClick={() => history.goBack()}
          >
            arrow_back
          </i>
          <span>Create Theme</span>
        </div>
        <div className="right-align">
        <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSubmit()}
          >
            <span className="material-symbols-outlined mr-2">save</span>
            <span>Save Theme</span>
          </button>
        </div>
      </h1>
      <div className="content">
        <Form className="mt-2">
          <div className="alert alert-info" role="alert">
            <b>Developer Zone:</b> This feature will fork a theme's project so you can edit and use it. Before proceeding, please make sure you have <a href="https://docs.github.com/en/get-started/getting-started-with-git/set-up-git#setting-up-git" target="_blank">setup Git</a>.
          </div>
          <Form.Group className="form-group row">
            <InputGroup className="input-group-lg mb-2">
              <Form.Label className="col-sm-2 col-form-label">Theme Name</Form.Label>
              <Col className="col-sm-10">
                <Form.Control type="text" className="form-control" ref={themeNameRef} value={themeName} onChange={e => setThemeName(e.target.value)} />
              </Col>
            </InputGroup>
            <InputGroup className="input-group-lg mb-2">
              <Form.Label className="col-sm-2 col-form-label">Theme Id</Form.Label>
              <Col className="col-sm-10">
                <Form.Control type="text" className="form-control" disabled value={themeId} />
              </Col>
            </InputGroup>
            <InputGroup className="input-group-lg mb-2">
              <Form.Label className="col-sm-2 col-form-label">Parser</Form.Label>
              <Col className="col-sm-10">
                <Form.Select aria-label="Default select example" disabled>
                  <option value="react">React</option>
                </Form.Select>
              </Col>
            </InputGroup>
            <InputGroup className="input-group-lg mb-2">
              <Form.Label className="col-sm-2 col-form-label">Theme Base</Form.Label>
              <Col className="col-sm-10">
                <Form.Select aria-label="Default select example" defaultValue={themeList.current.find(({ name}) => name === "slate")?.homepage} onChange={(e) => {
                  setThemeBase(e.target.value);
                }}>
                  {themeList.current.map((theme) => {
                    return (
                      <option key={theme.name} value={theme.homepage}>{theme.title} - {theme.homepage}</option>
                    )
                  })}
                </Form.Select>
              </Col>
            </InputGroup>
          </Form.Group>
        </Form>
      </div>
    </div>
  );
};

export default ThemeCreator;
