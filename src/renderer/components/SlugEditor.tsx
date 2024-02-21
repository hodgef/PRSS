import "./styles/SlugEditor.css";

import React, { FunctionComponent, useState, Fragment, useEffect } from "react";

import { getString } from "../../common/utils";
import { error, normalize, appendSlash } from "../services/utils";
import cx from "classnames";
import { getBufferItems } from "../services/build";
import { isValidSlug } from "../services/hosting";
import { modal } from "./Modal";

interface IProps {
  site: ISite;
  post: IPostItem;
  items: IPostItem[];
  url?: string;
  onSave: (s: string) => any;
  previewMode?: boolean;
}

const SlugEditor: FunctionComponent<IProps> = ({
  site,
  post,
  items,
  onSave,
  previewMode,
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(post.slug);
  const [bufferItems, setBufferItems] = useState(null);

  useEffect(() => {
    const getData = async () => {
      const bufferItems = await getBufferItems(site);
      setBufferItems(bufferItems);
      setValue(post.slug);
    };
    getData();
  }, [site, post]);

  const bufferItem = bufferItems
    ? bufferItems.find((bufferItem) => bufferItem.item.uuid === post.uuid)
    : null;

  if (!site || !items || !post || !bufferItem) {
    return null;
  }

  const save = async () => {
    if (!value.trim()) {
      error("The slug must have a value");
      return;
    }

    if (!post) {
      return;
    }

    const normalizedSlug = normalize(value);

    if (!(await isValidSlug(normalizedSlug, site.uuid, post.uuid))) {
      modal.alert(getString("error_invalid_slug"));
      return;
    }

    /**
     * Ensure slug is unique
     */
    // const itemsWithSlug = items.filter(
    //     item => item.slug === normalizedSlug
    // );

    // if (itemsWithSlug.length > 1) {
    //     error('You have items with the same slug');
    //     return;
    // }

    // if (itemsWithSlug.length === 1 && itemsWithSlug[0].uuid !== post.uuid) {
    //     error('You have an item with the same slug');
    //     return;
    // }

    await onSave(normalizedSlug);
    setEditing(false);
  };

  const getUrlPath = (path = "") => {
    let host = site.url;

    if (previewMode) {
      // TODO: Find a way to get host from BrowserSync
      host = "http://localhost:3000/";
    }

    return appendSlash(host + path);
  };

  return (
    <div className={cx("slug-editor", { editing })}>
      {editing ? (
        <Fragment>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mr-2"
          />
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => setEditing(false)}
          >
            <i className="material-icons">clear</i>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => save()}
          >
            <i className="material-icons">check</i>
          </button>
        </Fragment>
      ) : (
        <Fragment>
          {bufferItem.path !== "/" ? (
            <Fragment>
              <a
                href={getUrlPath(bufferItem.path.substring(1))}
                target="_blank"
                rel="noopener noreferrer"
                title={getUrlPath(bufferItem.path.substring(1))}
                className="mr-2"
              >
                {value}
              </a>

              <i
                className="material-icons clickable"
                onClick={() => {
                  setValue(post.slug);
                  setEditing(true);
                }}
              >
                edit
              </i>
            </Fragment>
          ) : (
            <a
              href={getUrlPath()}
              target="_blank"
              rel="noopener noreferrer"
              title={getUrlPath()}
              className="mr-2 font-italic"
            >
              Site Index
            </a>
          )}
        </Fragment>
      )}
    </div>
  );
};

export default SlugEditor;
