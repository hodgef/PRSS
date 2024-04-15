import "./styles/HTMLEditorOverlay.css";

import React, { FunctionComponent, useRef, Fragment, useState } from "react";
import cx from "classnames";
import { noop } from "../services/utils";

import AceEditor from "react-ace";
import "ace-builds/webpack-resolver";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/theme-github";
import pretty from "pretty";
import { toast } from "react-toastify";
import { modal } from "./Modal";
import bufferItemMockJson from "../json/bufferItem.json";
import { Noop } from "../../common/interfaces";

const htmlMinifier = require("html-minifier-terser");
interface IProps {
  headDefaultValue?: string;
  footerDefaultValue?: string;
  sidebarDefaultValue?: string;
  onSave: (headHtml: string, footerHtml: string, sidebarHtml: string) => void;
  onClose: Noop;
}

const HTMLEditorOverlay: FunctionComponent<IProps> = ({
  headDefaultValue = "",
  footerDefaultValue = "",
  sidebarDefaultValue = "",
  onSave = (h, f, s) => {},
  onClose = noop,
}) => {
  const [headHtmlEnabled, setHeadHtmlEnabled] = useState(true);
  const [footerHtmlEnabled, setFooterHtmlEnabled] = useState(false);
  const [sidebarHtmlEnabled, setSidebarHtmlEnabled] = useState(false);

  const headHTMLState = useRef(headDefaultValue);
  const footerHTMLState = useRef(footerDefaultValue);
  const sidebarHTMLState = useRef(sidebarDefaultValue);

  const handleSave = () => {
    if (
      onSave &&
      (headHTMLState.current !== headDefaultValue ||
        footerHTMLState.current !== footerDefaultValue ||
        sidebarHTMLState.current !== sidebarDefaultValue)
    ) {
      onSave(
        htmlMinifier.minify(headHTMLState.current || ""),
        htmlMinifier.minify(footerHTMLState.current || ""),
        htmlMinifier.minify(sidebarHTMLState.current || "")
      );
    } else {
      toast.success("No changes detected");
    }
  };

  const showParametersInfo = () => {
    modal.alert(
      <Fragment>
        <p>You can add parameters to your HTML</p>
        <p>
          For example:{" "}
          <span className="code-dark-inline">
            &lt;title&gt;%item.title%&lt;/title&gt;
          </span>
        </p>
        <p>Here are the available parameters (with sample data):</p>
        <div className="code-dark">
          {JSON.stringify(bufferItemMockJson, null, 2)}
        </div>
      </Fragment>,
      null,
      "parameters-info-content",
      "parameters-info-inner-content",
      "parameters-info-content"
    );
  };

  return (
    <div className="html-editor-overlay">
      <div className="editor-content">
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
            className="btn btn-outline-primary"
            onClick={() => onClose()}
          >
            <span className="material-symbols-outlined">clear</span>
          </button>
        </div>

        <h2>
          <button
            type="button"
            className={cx("btn", {
              expanded: headHtmlEnabled,
            })}
            onClick={() => setHeadHtmlEnabled(!headHtmlEnabled)}
          >
            <span className="material-symbols-outlined">expand_more</span>
          </button>
          <span>Head</span>
        </h2>
        {headHtmlEnabled && (
          <>
            <div className="title-label">
              <div className="left-align">Add Raw HTML to the &lt;HEAD&gt;</div>
                <div
                  className="right-align available-parameters clickable"
                  onClick={() => showParametersInfo()}
                >
                  <span className="material-symbols-outlined mr-1">assistant</span>
                  <span>See available parameters</span>
                </div>
            </div>
            <AceEditor
              mode="html"
              theme="github"
              wrapEnabled
              width="100%"
              showPrintMargin={false}
              showGutter
              fontSize={17}
              value={pretty(headHTMLState.current)}
              onChange={(html) => {
                headHTMLState.current = html;
              }}
              name="html-editor-component"
              editorProps={{ $blockScrolling: true }}
            />
          </>
        )}
        
        <h2>
          <button
            type="button"
            className={cx("btn", {
              expanded: footerHtmlEnabled,
            })}
            onClick={() => setFooterHtmlEnabled(!footerHtmlEnabled)}
          >
            <span className="material-symbols-outlined">expand_more</span>
          </button>
          <span>Footer</span>
        </h2>
        {footerHtmlEnabled && (
          <>
            <div className="title-label">
              <div className="left-align">
                Add Raw HTML to the end of the &lt;BODY&gt;
              </div>
            </div>
            <AceEditor
              mode="html"
              theme="github"
              wrapEnabled
              width="100%"
              showPrintMargin={false}
              showGutter
              fontSize={17}
              value={pretty(footerHTMLState.current)}
              onChange={(html) => {
                footerHTMLState.current = html;
              }}
              name="html-editor-component"
              editorProps={{ $blockScrolling: true }}
            />
          </>
        )}

        <h2>
          <button
            type="button"
            className={cx("btn", {
              expanded: sidebarHtmlEnabled,
            })}
            onClick={() => setSidebarHtmlEnabled(!sidebarHtmlEnabled)}
          >
            <span className="material-symbols-outlined">expand_more</span>
          </button>
          <span>Sidebar</span>
        </h2>
        {sidebarHtmlEnabled && (
          <>
            <div className="title-label">
              <div className="left-align">
                If your theme supports sidebars, you can add Raw HTML to it.
              </div>
            </div>
            <AceEditor
              mode="html"
              theme="github"
              wrapEnabled
              width="100%"
              showPrintMargin={false}
              showGutter
              fontSize={17}
              value={pretty(sidebarHTMLState.current)}
              onChange={(html) => {
                sidebarHTMLState.current = html;
              }}
              name="html-editor-component"
              editorProps={{ $blockScrolling: true }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default HTMLEditorOverlay;
