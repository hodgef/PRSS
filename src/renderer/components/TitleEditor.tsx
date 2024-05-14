import "./styles/TitleEditor.css";

import React, { FunctionComponent, useState, Fragment, useEffect } from "react";

import { normalize, removeStopWords } from "../services/utils";
import cx from "classnames";
import { getItem } from "../services/db";
import { isValidSlug } from "../services/hosting";
import { modal } from "./Modal";
import { runHook } from "../../common/bootstrap";

interface IProps {
  siteId: string;
  postId: string;
  initValue: string;
  onSave: (s: string, sl?: string) => any;
}

const TitleEditor: FunctionComponent<IProps> = ({
  siteId,
  postId,
  initValue = "",
  onSave,
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initValue);
  const [post, setPost] = useState(null);

  useEffect(() => {
    const getData = async () => {
      const item = await getItem(siteId, postId);
      setPost(item);
    };
    getData();
  }, []);

  if (!post) {
    return null;
  }

  const save = async () => {
    if (!value.trim()) {
      modal.alert(["title_missing", []]);
      return;
    }

    if (!post) {
      return;
    }

    const prevTitle = post.title;
    const cloneStr = "[CLONE]";

    /**
     * If previous title was a [CLONE], trigger slug change...
     */
    const newSlug =
      prevTitle.includes(cloneStr) && !value.includes(cloneStr)
        ? normalize(removeStopWords(value))
        : null;
    const slugChangeAllowed = newSlug
      ? await isValidSlug(newSlug, siteId, post.uuid)
      : null;

    await onSave(value, slugChangeAllowed ? newSlug : null);
    setPost({ ...post, title: value });
    runHook("SlugEditor_setTitle", value);
    setEditing(false);
  };

  return (
    <div className={cx("title-editor mr-4", { editing })}>
      {editing ? (
        <Fragment>
          <input value={value} onChange={(e) => setValue(e.target.value)} />
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => setEditing(false)}
          >
            <i className="material-symbols-outlined">clear</i>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => save()}
          >
            <i className="material-symbols-outlined">check</i>
          </button>
        </Fragment>
      ) : (
        <Fragment>
          <span title={post.title}>{post.template === "component" && <i>Component: </i>}{post.template === "none" && <i>Hidden: </i>}{post.title}</span>
          <i
            className="material-symbols-outlined clickable"
            style={{ fontSize: "26px" }}
            onClick={() => {
              setValue(post.title);
              setEditing(true);
            }}
          >
            edit
          </i>
        </Fragment>
      )}
    </div>
  );
};

export default TitleEditor;
