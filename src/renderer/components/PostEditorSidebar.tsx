import "./styles/PostEditorSidebar.css";

import React, { FunctionComponent, useState, Fragment, useEffect, useRef } from "react";
import cx from "classnames";
import { noop, uploadAssetImage, removeAssetImage, showCoachmark } from "../services/utils";
import Loading from "./Loading";
import { configGet, getString, isVariablesCoachmarkEnabled } from "../../common/utils";
import { modal } from "./Modal";
import { getTemplateList } from "../services/theme";
import { IPostItem, ISite, Noop } from "../../common/interfaces";
import { setHook, storeInt } from "../../common/bootstrap";
import { isPreviewActive } from "../services/preview";
import { updateItem } from "../services/db";

interface IProps {
  site: ISite;
  item: IPostItem;
  forceRawHTMLEditing: boolean;
  onSave?: Noop;
  onStopPreview?: Noop;
  onStartPreview?: Noop;
  onPublish?: Noop;
  onSaveRebuildAll?: Noop;
  onChangePostTemplate?: (t: string) => void;
  onOpenRawHTMLOverlay?: Noop;
  onOpenVarEditorOverlay?: Noop;
  onToggleRawHTMLOnly?: Noop;
  onFeaturedImageSet?: Noop;
}

const PostEditorSidebar: FunctionComponent<IProps> = ({
  site,
  item,
  forceRawHTMLEditing = false,
  onSave = noop,
  onSaveRebuildAll = noop,
  onStopPreview = noop,
  onStartPreview = noop,
  onPublish = noop,
  onChangePostTemplate = (t) => { },
  onOpenRawHTMLOverlay = noop,
  onOpenVarEditorOverlay = noop,
  onToggleRawHTMLOnly = noop,
  onFeaturedImageSet = noop,
}) => {
  const themeName = site.theme;
  const themesCoachmarkEnabled = useRef<boolean>(isVariablesCoachmarkEnabled());
  const [updatedItem, setUpdatedItem] = useState<IPostItem>(item);
  const [deployLoading, setDeployLoading] = useState<boolean>(false);
  const [buildLoading, setBuildLoading] = useState<boolean>(false);
  const [buildAllLoading, setBuildAllLoading] = useState<boolean>(false);
  const [editorChanged, setEditorChanged] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>(null)
  const [currentTemplate, setCurrentTemplate] = useState<string>(item.template);
  const [showMoreOptions, setShowMoreOptions] = useState(themesCoachmarkEnabled.current);
  const [templateList, setTemplateList] = useState(null);
  const [previewStarted, setPreviewStarted] = useState<boolean>(isPreviewActive());
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [publishSuggested, setPublishSuggested] = useState(configGet(`sites.${site.uuid}.publishSuggested`));

  useEffect(() => {
    getTemplateList(themeName).then((res) => {
      setTemplateList(res);
    });

    setHook("PostEditorSidebar_publishSuggested", (value: boolean) => {
      setPublishSuggested(value);
    });

    setHook("PostEditorSidebar_previewStarted", (value: boolean) => {
      setPreviewStarted(value);
    });

    setHook("PostEditorSidebar_loadingStatus", (value: string) => {
      setLoadingStatus(value);
    });

    setHook("PostEditorSidebar_editorChanged", (value: boolean) => {
      setEditorChanged(value);
    });

    setHook("PostEditorSidebar_previewLoading", (value: boolean) => {
      setPreviewLoading(value);
    });

    setHook("PostEditorSidebar_buildLoading", (value: boolean) => {
      setBuildLoading(value);
    });

    setHook("PostEditorSidebar_buildAllLoading", (value: boolean) => {
      setBuildAllLoading(value);
    });

    setHook("PostEditorSidebar_deployLoading", (value: boolean) => {
      setDeployLoading(value);
    });

    setHook("PostEditorSidebar_setUpdatedItem", (value: IPostItem) => {
      setUpdatedItem(value);
    });

    if(isVariablesCoachmarkEnabled()){
      storeInt.set("variablesCoachmarkEnabled", false);
    }
  }, []);

  if (!templateList) {
    return null;
  }

  const setFeaturedImage = async () => {
    if (!updatedItem) {
      return;
    }

    const filePath = await uploadAssetImage(site.name);

    if (filePath) {
      // Update post vars
      const newItem = {
        ...updatedItem,
        vars: {
          ...updatedItem.vars,
          featuredImageUrl: filePath
        },
        updatedAt: Date.now()
      };

      /**
       *  Update item
       */
      await updateItem(site.uuid, item.uuid, {
        vars: {
          ...item.vars,
          featuredImageUrl: filePath
        },
        updatedAt: Date.now()
      });

      item = newItem;
      setUpdatedItem(newItem);
      onFeaturedImageSet();
    }
  }

  const removeFeaturedImage = async () => {
    if (!updatedItem) {
      return;
    }

    const updatedVars = { ...updatedItem.vars };
    await removeAssetImage(site.name, updatedVars.featuredImageUrl);

    delete updatedVars.featuredImageUrl;

    // Update post vars
    const newItem = {
      ...updatedItem,
      vars: updatedVars,
      updatedAt: Date.now()
    };

    /**
     *  Update item
     */
    await updateItem(site.uuid, updatedItem.uuid, {
      vars: updatedVars,
      updatedAt: Date.now()
    });

    item = newItem;
    setUpdatedItem(newItem);
    onFeaturedImageSet();
  }

  const buildStr = previewStarted ? "Save & Build" : "Save";

  return (
    <div className="editor-sidebar">
      <ul className="editor-sidebar-featured">
        <li
          title={
            previewStarted
              ? "Save and build only this post"
              : "Save your changes locally"
          }
          className="clickable"
          onClick={() => onSave()}
        >
          {buildLoading ? (
            <Loading small classNames="mr-1" />
          ) : (
            <i className="material-symbols-outlined">save_alt</i>
          )}

          <span>{buildLoading ? loadingStatus : buildStr}</span>

          {editorChanged && (
            <span
              className="color-red ml-1"
              title={getString("warn_unsaved_changes")}
            >
              *
            </span>
          )}
        </li>
        {previewStarted && (
          <li
            title="Build whole site"
            className="clickable"
            onClick={() => onSaveRebuildAll()}
          >
            {buildAllLoading ? (
              <Loading small classNames="mr-1" />
            ) : (
              <i className="material-symbols-outlined">all_inbox</i>
            )}

            <span>{buildAllLoading ? loadingStatus : "Save & Build All"}</span>

            {/*editorChanged && (
                            <span
                                className="color-red ml-1"
                                title={getString('warn_unsaved_changes')}
                            >
                                *
                            </span>
                        )*/}
          </li>
        )}
        {previewStarted ? (
          <li
            title={getString("preview_description_message")}
            className="clickable"
            onClick={() => onStopPreview()}
          >
            {previewLoading ? (
              <Loading small classNames="mr-1" />
            ) : (
              <i className="material-symbols-outlined">stop</i>
            )}
            <span>Stop Preview</span>
          </li>
        ) : (
          <li className="clickable" onClick={() => onStartPreview()}>
            {previewLoading ? (
              <Loading small classNames="mr-1" />
            ) : (
              <i className="material-symbols-outlined">play_arrow</i>
            )}
            <span>{previewLoading ? loadingStatus : "Preview"}</span>
          </li>
        )}
        <li
          title={editorChanged ? getString("warn_unsaved_changes") : ""}
          className={cx("clickable", {
            disabled: editorChanged,
          })}
          onClick={() => {
            if (!editorChanged) {
              onPublish();
            } else {
              modal.alert(["error_publish_save_changes", []]);
            }
          }}
        >
          {deployLoading ? (
            <Loading small classNames="mr-1" />
          ) : (
            <i className="material-symbols-outlined">publish</i>
          )}
          <span>{deployLoading ? loadingStatus : "Publish"}</span>
          {publishSuggested && (
            <span
              className="color-red ml-1"
              title={getString("warn_unpublished_changes")}
            >
              *
            </span>
          )}
        </li>
      </ul>

      {showMoreOptions && (
        <ul className="editor-sidebar-more">
          <li>
            <div className="input-group">
              <div className="input-group-prepend">
                <label className="input-group-text" htmlFor="theme-selector">
                  Template
                </label>
              </div>
              <select
                className="custom-select"
                id="theme-selector"
                onChange={(e) => {
                  onChangePostTemplate(e.target.value);
                  setCurrentTemplate(e.target.value);
                }}
                value={currentTemplate}
              >
                {templateList.map((templateName) => (
                  <option key={`option-${templateName}`} value={templateName}>
                    {templateName}
                  </option>
                ))}
              </select>
            </div>
          </li>

          <li className="clickable" onClick={() => onOpenRawHTMLOverlay()}>
            <span className="material-symbols-outlined">code</span>{" "}
            <span>Add Raw HTML code</span>
          </li>
          <li className="clickable" onClick={() => onOpenVarEditorOverlay()} ref={r => {
            if(themesCoachmarkEnabled.current){
              showCoachmark(r, "variables-coachmark", "You can customize your Template here", "coachmark-left", () => {
                storeInt.set("variablesCoachmarkEnabled", false);
              });
            }
          }}>
            <span className="material-symbols-outlined">create</span>{" "}
            <span>Edit Variables</span>
          </li>

          {updatedItem?.vars.featuredImageUrl ? (
            <li className="clickable" onClick={() => removeFeaturedImage()}>
              <span className="material-symbols-outlined">close</span>{" "}
              <span>Remove Featured Image</span>
            </li>
          ) : (
            <li className="clickable" onClick={() => setFeaturedImage()}>
              <span className="material-symbols-outlined">image</span>{" "}
              <span>Set Featured Image</span>
            </li>
          )}
        </ul>
      )}

      <div
        className="sidebar-more-toggle clickable"
        onClick={() => setShowMoreOptions(!showMoreOptions)}
      >
        {showMoreOptions ? (
          <Fragment>
            <span className="material-symbols-outlined">keyboard_arrow_up</span>{" "}
            <span>Less Settings</span>
          </Fragment>
        ) : (
          <Fragment>
            <span className="material-symbols-outlined">keyboard_arrow_down</span>{" "}
            <span>More Settings</span>
          </Fragment>
        )}
      </div>
    </div>
  );
};

export default PostEditorSidebar;
