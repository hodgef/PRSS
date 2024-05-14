import "./styles/SlugEditor.css";

import React, { FunctionComponent, useState, Fragment, useEffect } from "react";

import { normalize, appendSlash } from "../services/utils";
import cx from "classnames";
import { getBufferItems } from "../services/build";
import { isValidSlug } from "../services/hosting";
import { modal } from "./Modal";
import { IPostItem, ISite } from "../../common/interfaces";
import { isPreviewActive } from "../services/preview";
import { setHook } from "../../common/bootstrap";
import { toast } from "react-toastify";

interface IProps {
  site: ISite;
  post: IPostItem;
  items: IPostItem[];
  url?: string;
  onSave: (s: string) => any;
}

const SlugEditor: FunctionComponent<IProps> = ({
  site,
  post,
  items,
  onSave,
}) => {
  const [title, setTitle] = useState<string>(post.title);
  const [isUneditable] = useState(post.slug.toLowerCase() === "home" || post.slug.toLowerCase() === "blog");
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(post.slug);
  const [bufferItems, setBufferItems] = useState(null);
  const [previewMode, setPreviewMode] = useState<boolean>(isPreviewActive());

  useEffect(() => {
    setHook("SlugEditor_previewMode", (value: boolean) => {
      setPreviewMode(value);
    });
    setHook("SlugEditor_setTitle", (value: string) => {
      setTitle(value);
    });
  }, []);

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

  const refreshSlug = async () => {
    if (!post) {
      return;
    }

    if (isUneditable) {
      modal.alert(["site_slug_protected", [post.slug]]);
      return;
    }

    const normalizedSlug = normalize(title);

    if (!(await isValidSlug(normalizedSlug, site.uuid, post.uuid))) {
      modal.alert(["error_invalid_slug", []]);
      return;
    }

    /**
     * Ensure slug is unique
     */
    const itemsWithSlug = items.filter(
        item => item.slug === normalizedSlug
    );

    if (itemsWithSlug.length > 1) {
        toast.error('You have items with the same slug');
        return;
    }

    if (itemsWithSlug.length === 1 && itemsWithSlug[0].uuid !== post.uuid) {
        toast.error('You have an item with the same slug');
        return;
    }

    await onSave(normalizedSlug);
    setValue(normalizedSlug);
    setEditing(false);
  };

  const save = async () => {
    if (!value.trim()) {
      modal.alert(["site_slug_val", []]);
      return;
    }

    if (isUneditable) {
      modal.alert(["site_slug_protected", [value]]);
      return;
    }

    if (!post) {
      return;
    }

    const normalizedSlug = normalize(value);

    if (!(await isValidSlug(normalizedSlug, site.uuid, post.uuid))) {
      modal.alert(["error_invalid_slug", []]);
      return;
    }

    /**
     * Ensure slug is unique
     */
    const itemsWithSlug = items.filter(
        item => item.slug === normalizedSlug
    );

    if (itemsWithSlug.length > 1) {
        toast.error('You have items with the same slug');
        return;
    }

    if (itemsWithSlug.length === 1 && itemsWithSlug[0].uuid !== post.uuid) {
        toast.error('You have an item with the same slug');
        return;
    }

    await onSave(normalizedSlug);
    setValue(normalizedSlug);
    setEditing(false);
  };

  const getUrlPath = (path = "") => {
    let host = site?.url;

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
          {bufferItem.path !== "/" ? (
            <Fragment>
              <>
                {(site?.url || previewMode) ? (
                  <a
                    href={getUrlPath(bufferItem.path.substring(1))}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={getUrlPath(bufferItem.path.substring(1))}
                    className="mr-2"
                    onClick={() => {

                    }}
                  >
                    {value}
                  </a>
                ) : (
                  <span>{value}</span>
                )}
              </>
              <>
                {!isUneditable && (
                  <i
                    className="material-symbols-outlined clickable"
                    title="Edit Slug"
                    onClick={() => {
                      setValue(post.slug);
                      setEditing(true);
                    }}
                  >
                    edit
                  </i>
                )}
              </>
              <>
                {!isUneditable && (
                  <i
                    className="material-symbols-outlined clickable"
                    title="Refresh Slug to match title"
                    onClick={refreshSlug}
                  >
                    refresh
                  </i>
                )}
              </>
            </Fragment>
          ) : (
            <>
              {(site?.url || previewMode) ? (
                <a
                  href={getUrlPath()}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={getUrlPath()}
                  className="mr-2 font-italic"
                >
                  Site Index
                </a>
              ) : (
                <span>Site Index</span>
              )}
            </>
          )}
        </Fragment>
      )}
    </div>
  );
};

export default SlugEditor;
