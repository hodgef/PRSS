import "./styles/PostEditor.css";
import "jodit/build/jodit.min.css";

import React, {
  Fragment,
  FunctionComponent,
  useRef,
  useState,
  useEffect,
  ReactNode
} from "react";
import { useHistory, useParams } from "react-router-dom";
import { getString, configGet, configSet } from "../../common/utils";
import Footer from "./Footer";
import { modal } from "./Modal";
import { toast } from "react-toastify";
import {
  previewServer,
  stopPreview,
  bufferAndStartPreview
} from "../services/preview";
import { build } from "../services/build";
import { buildAndDeploy } from "../services/hosting";
import SlugEditor from "./SlugEditor";
import TitleEditor from "./TitleEditor";
import PostEditorSidebar from "./PostEditorSidebar";
import HTMLEditorOverlay from "./HTMLEditorOverlay";
import SiteVariablesEditorOverlay from "./SiteVariablesEditorOverlay";
import { getSite, getItems, updateItem, updateSite } from "../services/db";
import { editorOptions } from "../services/editor";
import { truncateString } from "../services/utils";
const remote = require("electron").remote;
const win = remote.getCurrentWindow();

require("jodit");
const Editor = require("jodit-react").default;

interface IProps {
  setHeaderLeftComponent: (comp?: ReactNode) => void;
}

const PostEditor: FunctionComponent<IProps> = ({ setHeaderLeftComponent }) => {
  const { siteId, postId } = useParams();
  const [publishSuggested, setPublishSuggested] = useState(null);

  const [site, setSite] = useState(null);
  const [items, setItems] = useState(null);
  const { title, url } = (site as ISite) || {};

  const [post, setPost] = useState(null);

  const history = useHistory();
  const editorContent = useRef("");
  const editorMode = useRef("");
  const itemIndex = post ? items.findIndex(item => item.uuid === postId) : -1;

  const editorChangedContent = useRef("");

  const [previewStarted, setPreviewStarted] = useState(previewServer.active);
  const [showRawHTMLEditorOverlay, setShowRawHTMLEditorOverlay] = useState(
    false
  );

  const [
    showSiteVariablesEditorOverlay,
    setShowSiteVariablesEditorOverlay
  ] = useState(false);

  const [editorChanged, setEditorChanged] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildAllLoading, setBuildAllLoading] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");

  const editorResizeFix = () => {
    if (!win.isMaximized()) {
      window.resizeTo(window.outerWidth - 1, window.outerHeight - 1);
      window.resizeTo(window.outerWidth + 1, window.outerHeight + 1);
    }
  };

  useEffect(() => {
    if (!title || !post) {
      return;
    }

    editorResizeFix();

    setHeaderLeftComponent(
      <Fragment>
        <div className="align-center">
          <i className="material-icons">public</i>
          <a onClick={() => history.push(`/sites/${siteId}`)}>{title}</a>
        </div>
        <div className="align-center">
          <i className="material-icons">keyboard_arrow_right</i>
          <a onClick={() => history.push(`/sites/${siteId}/posts`)}>Posts</a>
        </div>
        {post && (
          <div className="align-center">
            <i className="material-icons">keyboard_arrow_right</i>
            <span>{truncateString(post.title, 30)}</span>
          </div>
        )}
      </Fragment>
    );
  }, [title, post]);

  useEffect(() => {
    const getData = async () => {
      const siteRes = await getSite(siteId);
      const itemsRes = await getItems(siteId);
      setSite(siteRes);
      setItems(itemsRes);
      const post = itemsRes.find(item => item.uuid === postId);

      setPost(post);

      const { publishSuggested } = configGet(`sites.${siteId}`);
      setPublishSuggested(publishSuggested);
      editorContent.current = post.content || "";
      editorMode.current = post.isContentRaw ? "html" : "";
    };
    getData();
  }, []);

  if (!site || !items || !post) {
    return null;
  }

  const handleSave = async (isAutosave = false, buildAll = false) => {
    if (buildAll) {
      setBuildAllLoading(true);
    } else {
      setBuildLoading(true);
    }

    const prevContent = post.content;

    if (editorMode.current === "html" && post && !post.isContentRaw) {
      modal.alert(getString("error_save_text_editor"));
      if (buildAll) {
        setBuildAllLoading(false);
      } else {
        setBuildLoading(false);
      }
      return;
    }

    const content = editorContent.current;

    /**
     * Warn if deleting content
     */
    if (prevContent !== content && !content.length) {
      console.warn("All content deleted");
    }

    if (itemIndex > -1) {
      const updatedAt = Date.now();
      const updatedItem = { ...post, content, updatedAt };
      const updatedSite = { ...site, updatedAt };

      /**
       *  Update item
       */
      await updateItem(siteId, postId, {
        content,
        updatedAt
      });

      /**
       * Update site updatedAt
       */
      await updateSite(siteId, {
        updatedAt
      });

      setPost(updatedItem);
      setSite(updatedSite);

      if (isAutosave) {
        toast.success("Post autosaved");
      } else {
        if (previewServer.active) {
          await buildPost(buildAll ? null : postId, setLoadingStatus);
          previewServer.reload();

          if (buildAll) {
            toast.success(
              "Post saved. The entire site has been rebuilt and the preview reloaded."
            );
          } else {
            toast.success(
              "Post saved. The page has been rebuilt and the preview reloaded."
            );
          }
        } else {
          toast.success("Post saved!");
        }

        editorChangedContent.current = "";
        setEditorChanged(false);
      }
    }

    if (buildAll) {
      setBuildAllLoading(false);
    } else {
      setBuildLoading(false);
    }
  };

  const handleSaveTitle = async (title, slug) => {
    const updatedAt = Date.now();
    const updatedItem = { ...post, title, updatedAt };
    updatedItem.slug = slug ? slug : updatedItem.slug;

    const itemSlug = slug ? slug : updatedItem.slug;

    /**
     *  Update item
     */
    await updateItem(siteId, postId, {
      title,
      slug: itemSlug,
      updatedAt
    });

    setPost(updatedItem);

    configSet(`sites.${siteId}.publishSuggested`, true);
    setPublishSuggested(true);
    toast.success("Title saved");
  };

  const handleSaveSlug = async (slug, silent?: boolean) => {
    const updatedAt = Date.now();
    const updatedItem = { ...post, slug, updatedAt };

    /**
     *  Update item
     */
    await updateItem(siteId, postId, {
      slug,
      updatedAt
    });

    setPost(updatedItem);

    configSet(`sites.${siteId}.publishSuggested`, true);
    setPublishSuggested(true);

    if (!silent) {
      toast.success("Slug saved");
    }
  };

  const changePostTemplate = async template => {
    if (!template || itemIndex === -1) return;
    const updatedItem = { ...post, template };
    const updatedAt = Date.now();

    /**
     *  Update item
     */
    await updateItem(siteId, postId, { template, updatedAt });
    setPost(updatedItem);

    configSet(`sites.${siteId}.publishSuggested`, true);
    setPublishSuggested(true);
    toast.success("Template changed successfully");
  };

  const toggleRawHTMLOnly = async () => {
    const isHTMLForced = !!post.isContentRaw;
    const isContentRaw = !isHTMLForced;
    const updatedAt = Date.now();

    const updatedItem = { ...post, isContentRaw };

    /**
     *  Update item
     */
    await updateItem(siteId, postId, { isContentRaw, updatedAt });

    setPost(updatedItem);

    toast.success("Raw HTML content flag changed successfully. Refreshing.");

    if (isHTMLForced) {
      stopPreview();
      history.replace(`/sites/${siteId}/posts/editor`);
      history.replace(`/sites/${siteId}/posts/editor/${post.uuid}`);
    }
  };

  const buildPost = async (postId = null, onUpdate = null) => {
    if (previewServer.active) {
      previewServer.pause();
    }
    await build(siteId, onUpdate, postId, postId ? true : false);
    if (previewServer.active) {
      previewServer.resume();
    }
  };

  const handleStartPreview = async () => {
    setPreviewLoading(true);

    if (editorMode.current === "html" && post && !post.isContentRaw) {
      modal.alert(getString("error_preview_text_editor"));
      setPreviewLoading(false);
      return;
    }

    const previewRes = await bufferAndStartPreview(
      siteId,
      setLoadingStatus,
      postId
    );

    if (previewRes) {
      setPreviewStarted(true);
    }

    setPreviewLoading(false);
  };

  const handleStopPreview = () => {
    setPreviewLoading(true);

    if (editorMode.current === "html" && post && !post.isContentRaw) {
      modal.alert(getString("error_preview_text_editor"));
      setPreviewLoading(false);
      return;
    }

    stopPreview();
    setPreviewStarted(false);
    setPreviewLoading(false);
  };

  const handlePublish = async () => {
    if (!url) {
      toast.error("Site URL not defined! Please add one in your Site Settings");
      return;
    }

    setDeployLoading(true);

    const deployRes = await buildAndDeploy(
      siteId,
      setLoadingStatus,
      null,
      true
    );

    if (deployRes) {
      toast.success(getString("publish_completed"));
    }

    if (typeof deployRes === "object") {
      if (deployRes.type === "redirect") {
        history.push(deployRes.value);
      }
    }

    if (publishSuggested) {
      configSet(`sites.${siteId}.publishSuggested`, false);
      setPublishSuggested(false);
    }

    setDeployLoading(false);
  };

  const openRawHTMLOverlay = () => {
    setShowRawHTMLEditorOverlay(true);
  };

  const openVariablesOverlay = () => {
    setShowSiteVariablesEditorOverlay(true);
  };

  const handleRawHTMLOverlaySave = async (
    headHtml,
    footerHtml,
    sidebarHtml
  ) => {
    const updatedAt = Date.now();

    if (itemIndex > -1) {
      const updatedItem = {
        ...post,
        headHtml,
        footerHtml,
        sidebarHtml
      };

      /**
       *  Update item
       */
      await updateItem(siteId, postId, {
        headHtml,
        footerHtml,
        sidebarHtml,
        updatedAt
      });

      setPost(updatedItem);

      toast.success("Post updated");
    }
  };

  return (
    <div className="PostEditor page">
      <div className="content">
        <h1>
          <div className="left-align">
            <i
              className="material-icons clickable"
              onClick={() => history.goBack()}
            >
              arrow_back
            </i>
            {post ? (
              <TitleEditor
                siteId={siteId}
                postId={postId}
                initValue={post ? post.title : null}
                onSave={handleSaveTitle}
              />
            ) : (
              <span>Post Editor</span>
            )}
          </div>
          <div className="right-align">
            {post && (
              <Fragment>
                <span className="slug-label mr-1">Editing:</span>
                <SlugEditor
                  post={post}
                  items={items}
                  site={site}
                  url={url}
                  previewMode={previewStarted}
                  onSave={handleSaveSlug}
                />
              </Fragment>
            )}
          </div>
        </h1>

        <div className="editor-container">
          <div className="left-align">
            <Editor
              value={post ? post.content : ""}
              config={editorOptions}
              onChange={content => {
                editorContent.current = content;

                if (!editorChangedContent.current) {
                  editorChangedContent.current = content;
                }

                if (editorChangedContent.current === content) {
                  setEditorChanged(false);
                } else {
                  setEditorChanged(true);
                }
              }}
            />
            {/*<StandardEditor
                            value={post ? post.content : ''}
                            onChange={content => {
                                editorContent.current = content;

                                if (!editorChangedContent.current) {
                                    editorChangedContent.current = content;
                                }

                                if (editorChangedContent.current === content) {
                                    setEditorChanged(false);
                                } else {
                                    setEditorChanged(true);
                                }
                            }}
                            onEditModeChange={mode =>
                                (editorMode.current = mode)
                            }
                            forceMode={
                                post && post.isContentRaw ? 'html' : null
                            }
                        />*/}
          </div>
          <div className="right-align">
            <PostEditorSidebar
              site={site}
              item={post}
              publishSuggested={publishSuggested}
              previewStarted={previewStarted}
              editorChanged={editorChanged}
              previewLoading={previewLoading}
              buildLoading={buildLoading}
              buildAllLoading={buildAllLoading}
              deployLoading={deployLoading}
              loadingStatus={loadingStatus}
              forceRawHTMLEditing={post ? post.isContentRaw : null}
              onSave={handleSave}
              onSaveRebuildAll={() => handleSave(false, true)}
              onStopPreview={handleStopPreview}
              onStartPreview={handleStartPreview}
              onPublish={handlePublish}
              onChangePostTemplate={changePostTemplate}
              onOpenRawHTMLOverlay={openRawHTMLOverlay}
              onOpenVarEditorOverlay={openVariablesOverlay}
              onToggleRawHTMLOnly={toggleRawHTMLOnly}
            />
          </div>
        </div>
      </div>
      {post && (
        <Fragment>
          {showRawHTMLEditorOverlay && (
            <HTMLEditorOverlay
              headDefaultValue={post.headHtml}
              footerDefaultValue={post.footerHtml}
              sidebarDefaultValue={post.sidebarHtml}
              onSave={handleRawHTMLOverlaySave}
              onClose={() => setShowRawHTMLEditorOverlay(false)}
            />
          )}

          {showSiteVariablesEditorOverlay && (
            <SiteVariablesEditorOverlay
              siteId={siteId}
              postId={postId}
              onClose={() => setShowSiteVariablesEditorOverlay(false)}
            />
          )}
        </Fragment>
      )}
    </div>
  );
};

export default PostEditor;
