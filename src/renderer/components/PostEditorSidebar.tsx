import "./styles/PostEditorSidebar.css";

import React, { FunctionComponent, useState, Fragment, useEffect } from "react";
import cx from "classnames";
import { noop, confirmation } from "../services/utils";
import Loading from "./Loading";
import { configGet, getString } from "../../common/utils";
import { modal } from "./Modal";
import { getTemplateList } from "../services/theme";
import { IPostItem, ISite, Noop } from "../../common/interfaces";
import { setHook } from "../../common/bootstrap";
import { isPreviewActive } from "../services/preview";

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
  onChangePostTemplate = (t) => {},
  onOpenRawHTMLOverlay = noop,
  onOpenVarEditorOverlay = noop,
  onToggleRawHTMLOnly = noop,
}) => {
  const themeName = site.theme;
  const [deployLoading, setDeployLoading] = useState<boolean>(false);
  const [buildLoading, setBuildLoading] = useState<boolean>(false);
  const [buildAllLoading, setBuildAllLoading] = useState<boolean>(false);
  const [editorChanged, setEditorChanged] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>(null)
  const [currentTemplate, setCurrentTemplate] = useState<string>(item.template);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
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
  }, []);

  if (!templateList) {
    return null;
  }

  const toggleForceRawHTML = async () => {
    if (forceRawHTMLEditing) {
      const confirmationRes = await confirmation({
        title: getString("warn_force_raw_html_disable"),
      });

      if (confirmationRes !== 0) {
        modal.alert(["action_cancelled", []]);
        return;
      }
    }

    onToggleRawHTMLOnly();
  };

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
          <li className="clickable" onClick={() => onOpenVarEditorOverlay()}>
            <span className="material-symbols-outlined">create</span>{" "}
            <span>Edit Variables</span>
          </li>
          {/*<li className="clickable">
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={forceRawHTMLEditing}
                                id="force-html-edit"
                                onChange={() => toggleForceRawHTML()}
                            />
                            <label
                                className="form-check-label"
                                htmlFor="force-html-edit"
                            >
                                Force Raw HTML Editing
                            </label>
                        </div>
                                </li>*/}
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
