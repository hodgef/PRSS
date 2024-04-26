import "./styles/SiteVariablesEditorOverlay.css";

import React, {
  FunctionComponent,
  useState,
  useRef,
  Fragment,
  useEffect,
} from "react";
import { Link } from "react-router-dom";
import cx from "classnames";

import { camelCase } from "../services/utils";

import "ace-builds/webpack-resolver";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/theme-github";
import { toast } from "react-toastify";
import { modal } from "./Modal";
import { siteVarToArray } from "../services/hosting";
import { getBufferItems } from "../services/build";
import { getSite, getItems, updateSite, updateItem } from "../services/db";
import { IPostItem, ISite } from "../../common/interfaces";
import { setHook } from "../../common/bootstrap";

interface IProps {
  siteId: string;
  onSave: () => void;
}

const SiteVariablesEditorOverlay: FunctionComponent<IProps> = ({
  siteId,
  onSave = () => {}
}) => {
  const [postId, setPostId] = useState<string>(null)
  const site = useRef<ISite>(null);
  const post = useRef<IPostItem>(null);
  const items = useRef<IPostItem[]>(null);

  const [bufferItem, setBufferItem] = useState(null);

  const [parsedVariables, setParsedVariables] = useState<{[key: string]: string}[]>([]);
  const [parsedInheritedVariables, setParsedInheritedVariables] = useState<{[key: string]: string}[]>([]);

  const [variables, setVariables] = useState<{[key: string]: string}[]>(parsedVariables);
  const [exclusiveVariables, setExclusiveVariables] = useState<string[]>([]);

  const variablesBuffer = useRef(parsedVariables) as any;

  useEffect(() => {
    setHook("SiteVariablesEditorOverlay_setPostId", async (value: string) => {
        const siteRes = await getSite(siteId);
        const itemsRes = await getItems(siteId);
  
        site.current = siteRes;
        items.current = itemsRes;
  
        const bufferItems = await getBufferItems(siteRes);
  
        const currentPost = value
          ? itemsRes.find((item) => item.uuid === value)
          : null;
        
        post.current = currentPost;
  
        const bufferItem =
          bufferItems && post
            ? bufferItems.find((bufferItem) => bufferItem.item.uuid === currentPost.uuid)
            : null;
  
        setBufferItem(bufferItem);
  
        const baseVars = post ? currentPost.vars || {} : siteRes.vars || {};
  
        const parsedVariables = siteVarToArray(
          Object.keys(baseVars).length ? baseVars : { "": "" }
        );
  
        setParsedVariables(parsedVariables);
        setVariables(parsedVariables);
  
        const exclusiveVariables = post ? currentPost.exclusiveVars || [] : [];
        setExclusiveVariables(exclusiveVariables);
  
        variablesBuffer.current = variablesBuffer;
        bufferItem &&
          setParsedInheritedVariables(siteVarToArray(bufferItem.vars));

        setPostId(value);
      });
  }, []);

  if (
    !postId ||
    !site ||
    !items ||
    (postId && (!post || !bufferItem)) ||
    !parsedVariables
  ) {
    return null;
  }

  const addNew = () => {
    setVariables((prevVars) => [...prevVars, { name: "", content: "" }]);
  };

  const setVar = (
    e,
    varIndex: number,
    fieldName: string,
    isNormalized?: boolean
  ) => {
    const newVars = [...variables];

    if (varIndex > -1) {
      newVars[varIndex] = {
        ...newVars[varIndex],
        [fieldName]: isNormalized ? camelCase(e.target.value) : e.target.value,
      };

      variablesBuffer;
      setVariables(newVars);
    }
  };

  const delVar = (varIndex: number) => {
    const newVars = [...variables];
    delete newVars[varIndex];

    return setVariables([...newVars.filter((variable) => !!variable)]);
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

  const handleSave = async () => {
    const updatedAt = Date.now();

    /**
     * Removing empty vars
     */
    const varsArray = variables.filter((varItem) => !!varItem.name.trim());

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
        ...post.current,
        vars: varObj,
        exclusiveVars: newExclusiveVarsArr,
        updatedAt,
      };

      /**
       *  Update item
       */
      await updateItem(siteId, postId, {
        vars: varObj,
        exclusiveVars: newExclusiveVarsArr,
        updatedAt,
      });

      post.current = updatedItem;

      onSave();
    } else {
      /**
       * Save to site
       */
      const updatedSite = {
        ...site.current,
        vars: varObj,
        updatedAt,
      };

      /**
       * Update site updatedAt
       */
      await updateSite(siteId, {
        vars: varObj,
        updatedAt,
      });

      site.current = updatedSite;
      toast.success("Site variables saved!");
    }
  };

  const showInfo = () => {
    modal.alert(
      <Fragment>
        <p>Site Variables are variables that your templates can use.</p>
        <p>
          For example: <span className="code-dark-inline">headerImageUrl</span>
        </p>
        <p>
          This variable would be used by some templates as a header image url.
        </p>
        <p>Each template generally documents the siteVars it uses.</p>
        <p>
          Note: A variable defined at the post level will override one set at
          the site level.
        </p>
        <p>
          Note 2: Variables are published to your site and therefore public. Do
          not store sensitive data in variables.
        </p>
      </Fragment>,
      null,
      "parameters-info-content",
      "parameters-info-inner-content",
      "site-variables-modal"
    );
  };

  return (
    <div className="sitevars-editor-overlay">
      <div className="editor-content">
        <h2>
          <div className="left-align">
            <span>Scoped Variables</span>
          </div>
          <div className="right-align">
            <button
              type="button"
              className="btn btn-primary mr-2"
              onClick={() => handleSave()}
            >
              <span className="material-symbols-outlined mr-2">save</span>
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
                setPostId(null);
              }}
            >
              <span className="material-symbols-outlined">clear</span>
            </button>
          </div>
        </h2>

        <div className="title-label">
          <div className="left-align">
            <span>Add, edit or delete variables</span>
          </div>
          <div
            className="right-align available-parameters clickable"
            onClick={() => showInfo()}
          >
            <span className="material-symbols-outlined mr-1">info</span>
            <span>What are variables?</span>
          </div>
        </div>

        <div className="variable-list mt-2">
          <ul>
            {variables.map((variable, index) => {
              const isRestricted = exclusiveVariables.includes(variable.name);

              return (
                <li
                  key={`${variable}-${index}`}
                  className={cx("mb-2", {
                    "restricted-var": isRestricted,
                  })}
                >
                  <div className="input-group input-group-lg">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Name"
                      value={variable.name}
                      maxLength={20}
                      onChange={(e) => setVar(e, index, "name")}
                      onBlur={(e) => setVar(e, index, "name", true)}
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Content"
                      value={variable.content}
                      onChange={(e) => setVar(e, index, "content")}
                    />
                    {post && (
                      <button
                        title="Prevent children from inheriting this variable"
                        type="button"
                        className={cx(
                          "btn btn-outline-primary ml-2 restrict-btn",
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
                      className="btn btn-outline-primary ml-2"
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

        {post && !!parsedInheritedVariables.length && (
          <>
            <h2>Computed Variables</h2>
            <p>
              This includes global variables from{" "}
              <Link to={`/sites/${siteId}/settings`}>Site Settings</Link> as
              well as parent variables.
            </p>
            <div className="inherited-variable-list">
            <ul>
              {parsedInheritedVariables.map((variable, index) => {
                return (
                  <li key={`inehrited-${variable}-${index}`} className="mb-2">
                    <div className="input-group input-group-lg">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Name"
                        value={variable.name}
                        maxLength={20}
                        readOnly
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Content"
                        value={variable.content}
                        readOnly
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SiteVariablesEditorOverlay;
