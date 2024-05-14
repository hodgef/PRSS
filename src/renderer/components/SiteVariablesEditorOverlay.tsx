import "./styles/SiteVariablesEditorOverlay.css";

import React, {
  FunctionComponent,
  useState,
  useRef,
  Fragment,
  useEffect,
  useCallback,
} from "react";
import { Link } from "react-router-dom";
import cx from "classnames";

import { camelCase, removeAssetImage, uploadAssetImage } from "../services/utils";

import "ace-builds/webpack-resolver";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/theme-github";
import { toast } from "react-toastify";
import { modal } from "./Modal";
import { siteVarToArray } from "../services/hosting";
import { getBufferItems } from "../services/build";
import { getItems, updateSite, updateItem, getSite } from "../services/db";
import { IPostItem, ISite, IThemeManifest } from "../../common/interfaces";
import { runHook, setHook } from "../../common/bootstrap";
import { getThemeManifest } from "../services/theme";
import Loading from "./Loading";

interface IProps {
  site: ISite;
  post?: IPostItem;
  onSave: () => void;
}

type IVarsKV = { name: string, content: string, type?: string };

const SiteVariablesEditorOverlay: FunctionComponent<IProps> = ({
  site,
  post,
  onSave = () => { }
}) => {
  const items = useRef<IPostItem[]>(null);

  const [updatedSite, setUpdatedSite] = useState<ISite>(site);
  const [bufferItem, setBufferItem] = useState(null);
  const [show, setShow] = useState<boolean>(false);
  const [parsedVariables, setParsedVariables] = useState<IVarsKV[]>([]);
  const [parsedInheritedVariables, setParsedInheritedVariables] = useState<IVarsKV[]>([]);

  const [themeManifest, setThemeManifest] = useState<IThemeManifest>(null);
  const [suggestedVariables, setSuggestedVariables] = useState<string[]>([]);

  const [variables, setVariables] = useState<IVarsKV[]>(parsedVariables);
  const [exclusiveVariables, setExclusiveVariables] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setHook("SiteVariablesEditorOverlay_show", async (value: string) => {
      setData();
    });

    setHook("SiteVariablesEditorOverlay_setIsLoading", async (value: boolean) => {
      setIsLoading(value);
    });
  }, []);

  const setData = useCallback(async () => {
    const siteRes = await getSite(site.uuid);
    const itemsRes = await getItems(siteRes.uuid);
    const currentItem = post ? itemsRes.find((item) => item.uuid === post.uuid) : null;
    const baseVars = currentItem ? currentItem.vars || {} : siteRes.vars || {};

    items.current = itemsRes;

    const bufferItems = await getBufferItems(siteRes);

    const bufferItem =
      bufferItems && currentItem
        ? bufferItems.find((bufferItem) => bufferItem.item.uuid === currentItem.uuid)
        : null;

    setBufferItem(bufferItem);

    const parsedVariables = siteVarToArray(
      Object.keys(baseVars).length ? baseVars : { "": "" }
    );

    setParsedVariables(parsedVariables);
    setVariables(parsedVariables);

    const exclusiveVariables = currentItem ? currentItem.exclusiveVars || [] : [];
    setExclusiveVariables(exclusiveVariables);

    if (bufferItem) {
      const bufferItemVars = siteVarToArray(bufferItem.vars);
      setParsedInheritedVariables(bufferItemVars);
    }

    // Get theme vars
    if (siteRes.theme) {
      const manifest = await getThemeManifest(siteRes.theme);

      // Add to parsed variables >> parsedVariables
      // Must not be in computed variables
      let suggestedVars = [];

      if (manifest.siteVars) {
        Object.keys(manifest.siteVars).forEach(manifestSiteVarName => {
          suggestedVars.push(manifestSiteVarName);
        });

        if (suggestedVars.length) {
          setThemeManifest(manifest);
          setSuggestedVariables(suggestedVars);
        }
      }
    }

    setUpdatedSite(siteRes);
    setShow(true);
  }, []);

  const addNew = (input?: IVarsKV) => {
    setVariables((prevVars) => [(input || { name: "", content: "" }), ...prevVars]);
  };

  const setVar = (
    varIndex: number,
    fieldName: string,
    value: string,
    isNormalized?: boolean
  ) => {
    const newVars = [...variables];

    if (varIndex > -1) {
      newVars[varIndex] = {
        ...newVars[varIndex],
        type: newVars[varIndex]?.type || themeManifest?.siteVars?.[fieldName]?.type || "string",
        [fieldName]: isNormalized ? camelCase(value) : value,
      };

      setVariables(newVars);
    }
  };

  const delVar = async (varIndex: number) => {
    const newVars = [...variables];
    delete newVars[varIndex];

    // If type is image and local path is used, we need to remove local image and update the site
    if(themeManifest?.siteVars?.[variables[varIndex].name]?.type === "image"){
      await removeAssetImage(site.name, variables[varIndex].content);

      // Update site or post
      const siteRes = await getSite(site.uuid);
      const itemsRes = await getItems(siteRes.uuid);
      const currentItem = post ? itemsRes.find((item) => item.uuid === post.uuid) : null;
      const baseVars = currentItem ? currentItem.vars || {} : siteRes.vars || {};
      
      delete baseVars[variables[varIndex].name];
      await handleSave(siteVarToArray(baseVars));
    }

    setVariables([...newVars.filter((variable) => !!variable)]);
  };

  
  const uploadImage = async (
    varIndex: number
  ) => {
    const newVars = [...variables];

    if (varIndex > -1) {
      const filePath = await uploadAssetImage(site.name);

      // Update variable
      newVars[varIndex] = {
        ...newVars[varIndex],
        content: filePath,
      };

      setVariables([...newVars]);
    }
  };

  const preventVarToggle = (varIndex: number) => {
    const newVars = [...variables];

    if (!newVars[varIndex]) return false;
    const selectedVariableName = newVars[varIndex].name;

    if (exclusiveVariables.includes(selectedVariableName)) {
      /**
       * Remove
       */
      return setExclusiveVariables([
        ...exclusiveVariables.filter(
          (variable) => variable !== selectedVariableName
        ),
      ]);
    } else {
      return setExclusiveVariables([
        ...exclusiveVariables,
        newVars[varIndex].name,
      ]);
    }
  };

  const handleSave = async (inputVars = variables) => {
    const updatedAt = Date.now();

    /**
     * Removing empty vars
     */
    const varsArray = inputVars.filter((varItem) => {
      const emptyName = !varItem.name.trim();
      //const emptyValAndSuggested = varItem.name && suggestedVariables.includes(varItem.name) && !varItem.content.trim();
      return !emptyName/* && !emptyValAndSuggested*/;
    });

    /**
     * Removing orphan exclusiveVars or duplicated
     */
    const newExclusiveVarsArr = exclusiveVariables.filter((varName, index) => {
      /**
       * If duplicate, filter out
       */
      if (exclusiveVariables.indexOf(varName) < index) {
        return false;
      }

      /**
       * Filter orphans
       */
      return varsArray.some((varItem) => varItem.name === varName);
    });

    const varObj = {};

    varsArray.forEach((varItem) => {
      varObj[varItem.name] = varItem.content;
    });

    /**
     * Save to post
     */
    if (post) {
      const updatedItem = {
        ...post,
        vars: varObj,
        exclusiveVars: newExclusiveVarsArr,
        updatedAt,
      };

      /**
       *  Update item
       */
      await updateItem(updatedSite.uuid, post.uuid, {
        vars: varObj,
        exclusiveVars: newExclusiveVarsArr,
        updatedAt,
      });

      post = updatedItem;
      
      onSave();
      runHook("PostEditorSidebar_setUpdatedItem", updatedItem);
    } else {
      /**
       * Save to site
       */
      const updatedSite = {
        ...site,
        vars: varObj,
        updatedAt,
      };

      /**
       * Update site updatedAt
       */
      await updateSite(updatedSite.uuid, {
        vars: varObj,
        updatedAt,
      });

      site = updatedSite;

      if(inputVars === variables){
        toast.success("Site variables saved!");
      }
    }
  };

  const getVarType = useCallback((name: string, type) => {
    if(type){
      return type;
    } else if (name.toLowerCase().includes("image")) {
      return "image";
    } else if (name.toLowerCase().includes("url")) {
      return "link";
    } else if (name.toLowerCase().includes("html")) {
      return "code";
    } else {
      return "string"
    }
  }, [variables]);

  const getVarIcon = useCallback((type = "string") => {
    if (type === "image") {
      return "image";
    } else if (type === "url") {
      return "link";
    } else if (type === "code") {
      return "code";
    } else {
      return "text_fields"
    }
  }, [variables]);

  const showInfo = () => {
    modal.alert(
      <Fragment>
        <p>Site Variables are variables that your templates can use.</p>
        <p>
          For example: <span className="code-dark-inline">featuredImageUrl</span>
        </p>
        <p>
          This variable would be used by some templates as a header image url.
        </p>
        <p>To see the available variables, check out the "Suggested Variables" section.</p>
        <p>
          <b>Note:</b> A variable defined at the post level will override one set at
          the site level.
        </p>
        <p>
          <b>Note #2:</b> Variables are published to your site and therefore public. Do
          not store sensitive data in variables.
        </p>
      </Fragment>,
      null,
      "parameters-info-content",
      "parameters-info-inner-content",
      "site-variables-modal"
    );
  };

  if (
    !show ||
    !site ||
    !parsedVariables
  ) {
    return null;
  }

  return (
    <div className="sitevars-editor-overlay">
      <div className="editor-content">
        <h2>
          <div className="left-align">
            <span>Variables Editor</span>
          </div>
          <div className="right-align">
            <button
              type="button"
              className="btn btn-primary mr-2"
              onClick={() => handleSave()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loading small classNames="mr-1" />
              ) : (
                <span className="material-symbols-outlined mr-2">save</span>
              )}
              <span>Save</span>
            </button>
            <button
              type="button"
              className="btn btn-outline-primary mr-2"
              onClick={() => addNew()}
            >
              <span className="material-symbols-outlined mr-2">add</span>
              <span>Add New</span>
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => {
                setShow(false);
              }}
            >
              <span className="material-symbols-outlined">clear</span>
            </button>
          </div>
        </h2>
        <div className="editor-sections">
          <div className="section-top">
            <div className="editor-section section-scoped">
              <h3>
                <div className="left-align">
                  <span>Scoped</span>
                </div>
                <div
                  className="right-align available-parameters clickable"
                  onClick={() => showInfo()}
                >
                  <span className="material-symbols-outlined mr-1">info</span>
                  <span>What are variables?</span>
                </div>
              </h3>
              <div className="title-label">
                <div className="left-align">
                  <span>Add, edit or delete variables for this page and descendants.</span>
                </div>
              </div>
              <div className="variable-list mt-2">
                <ul>
                  {variables.map((variable, index) => {
                    const isRestricted = exclusiveVariables.includes(variable.name);
                    console.log(variable.name, variable.type)

                    return (
                      <li
                        key={`${variable}-${index}`}
                        className={cx("mb-2", {
                          "restricted-var": isRestricted,
                        })}
                      >
                        <div className="input-group input-group-lg">
                          <span className="material-symbols-outlined mr-2 variable-type-icon">
                            {getVarIcon(getVarType(variable.name, variable.type || themeManifest?.siteVars?.[variable.name]?.type))}
                            <ul>
                              {["image", "url", "code", "string"].map((type, tIndex) => {
                                return (
                                  <li key={`var-selector-${variable.name}-${tIndex}`} data-vartype={type} title={type} onClick={() => setVar(index, "type", type)}>
                                    <span className="material-symbols-outlined mr-2 variable-type-icon">
                                      {getVarIcon(type)}
                                    </span>
                                  </li>
                                )
                              })}
                            </ul>
                          </span>
                          <div className="input-container">
                            <textarea
                              className="form-control"
                              placeholder="Name"
                              value={variable.name}
                              maxLength={20}
                              onChange={(e) => setVar(index, "name", e.target.value)}
                              onBlur={(e) => setVar(index, "name", e.target.value, true)}
                            />
                          </div>
                          <div className="input-container">
                            <textarea
                              className="form-control"
                              placeholder="Content"
                              value={variable.content}
                              onChange={(e) => setVar(index, "content", e.target.value)}
                            />
                          </div>
                          {(getVarType(variable.name, variable.type || themeManifest?.siteVars?.[variable.name]?.type) === "image") && (
                            <button
                              title="Upload image"
                              type="button"
                              className={cx(
                                "btn btn-outline-secondary upload-btn",
                              )}
                              onClick={() => uploadImage(index)}
                            >
                              <span className="material-symbols-outlined">upload</span>
                            </button>
                          )}
                          {post && (
                            <button
                              title="Prevent children from inheriting this variable"
                              type="button"
                              className={cx(
                                "btn btn-outline-secondary restrict-btn",
                                {
                                  "bg-dark text-white": isRestricted,
                                }
                              )}
                              onClick={() => preventVarToggle(index)}
                            >
                              <span className="material-symbols-outlined">block</span>
                            </button>
                          )}
                          <button
                            title="Delete Variable"
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => delVar(index)}
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            {post && !!parsedInheritedVariables.length && (
              <div className="editor-section section-computed">
                <h3>Computed</h3>
                <p>
                  This includes inherited variables from{" "}
                  <Link to={`/sites/${updatedSite.uuid}/settings`}>Site Settings</Link> as
                  well as parent variables.
                </p>
                <div className="inherited-variable-list">
                  <ul>
                    {parsedInheritedVariables.map((variable, index) => {
                      return (
                        <li key={`inehrited-${variable}-${index}`} className="mb-2">
                          <div className="input-group input-group-lg">
                            <div className="input-container">
                              <textarea
                                className="form-control"
                                placeholder="Name"
                                value={variable.name}
                                maxLength={20}
                                readOnly
                              />
                            </div>
                            <div className="input-container">
                              <textarea
                                className="form-control"
                                placeholder="Content"
                                value={variable.content}
                                readOnly
                              />
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </div>
          {(themeManifest && suggestedVariables.length) && (
            <div className="editor-section section-suggested">
              <h3>Suggested Variables</h3>
              <p>These are variables supported by your current theme (<Link to={`/sites/${updatedSite.uuid}/themes`}>{updatedSite.theme}</Link>)</p>
              <div className="suggested-variables">
                <ul>
                  {suggestedVariables.map((suggestedVar, suggestedVarIndex) => {
                    return (
                      <li
                        key={`${suggestedVar}-${suggestedVarIndex}`}
                        className="suggested-var"
                        title={themeManifest?.siteVars?.[suggestedVar]?.description}
                        onClick={() => addNew({ name: suggestedVar, content: "", type: themeManifest?.siteVars?.[suggestedVar]?.type } as IVarsKV)}
                      >
                        <span className="material-symbols-outlined mr-2">{getVarIcon(getVarType(suggestedVar, themeManifest?.siteVars?.[suggestedVar]?.type))}</span><span>{suggestedVar}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SiteVariablesEditorOverlay;
