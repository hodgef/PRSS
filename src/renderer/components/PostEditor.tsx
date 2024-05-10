import "./styles/PostEditor.css";

import React, {
  Fragment,
  FunctionComponent,
  useRef,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useHistory, useParams } from "react-router-dom";
import { getString, configGet, configSet, isAutosaveEnabled } from "../../common/utils";
import { modal } from "./Modal";
import {
  stopPreview,
  bufferAndStartPreview,
  isPreviewActive,
  reloadPreview,
  resumePreview,
  pausePreview,
} from "../services/preview";
import { build } from "../services/build";
import { buildAndDeploy } from "../services/hosting";
import SlugEditor from "./SlugEditor";
import TitleEditor from "./TitleEditor";
import PostEditorSidebar from "./PostEditorSidebar";
import HTMLEditorOverlay from "./HTMLEditorOverlay";
import SiteVariablesEditorOverlay from "./SiteVariablesEditorOverlay";
import { getSite, getItems, updateItem, updateSite } from "../services/db";
import { truncateString } from "../services/utils";
import { IPostItem, ISite } from "../../common/interfaces";
import { runHook, setHook } from "../../common/bootstrap";
import Footer from "./Footer";
import { debounce } from "lodash";
import Editor from "./EditorCore";
import Loading from "./Loading";

const remote = require("@electron/remote");
const win = remote.getCurrentWindow();

interface IProps {
  setHeaderLeftComponent: (comp?: ReactNode) => void;
}


const PostEditor: FunctionComponent<IProps> = ({ setHeaderLeftComponent }) => {
  const { siteId, postId } = useParams() as any;

  const autoSaveTimeout = useRef<NodeJS.Timeout>(null);
  const statusMessageTimeout = useRef<NodeJS.Timeout>(null);
  const [site, setSite] = useState<ISite>(null);
  const [isAIBusy, setIsAIBusy] = useState(false);
  const post = useRef<IPostItem>(null);
  const items = useRef<IPostItem[]>(null);
  const { title, url } = site || {};

  const history = useHistory();
  const editorContent = useRef<string>();
  const editorMode = useRef("");
  const postStatusRef = useRef<HTMLDivElement>(null);
  const itemIndex = items.current ? items.current.findIndex((item) => item.uuid === postId) : -1;
  const buildBusy = useRef<boolean>(false);

  const editorResizeFix = useCallback(() => {
    if (!win.isMaximized()) {
      window.resizeTo(window.outerWidth - 1, window.outerHeight - 1);
      window.resizeTo(window.outerWidth + 1, window.outerHeight + 1);
    }
  }, []);

  const setPublishSuggested = useCallback((state: boolean) => {
    runHook("PostEditorSidebar_publishSuggested", state);
  }, []);

  const setEditorChanged = useCallback((state: boolean) => {
    runHook("PostEditorSidebar_editorChanged", state);
  }, []);

  const setPreviewStarted = useCallback((state: boolean) => {
    runHook("SlugEditor_previewMode", state);
    runHook("PostEditorSidebar_previewStarted", state);
  }, []);

  const setPreviewLoading = useCallback((state: boolean) => {
    runHook("PostEditorSidebar_previewLoading", state);
    buildBusy.current = state;
  }, []);

  const setBuildLoading = useCallback((state: boolean) => {
    runHook("PostEditorSidebar_buildLoading", state);
    buildBusy.current = state;
  }, []);

  const setBuildAllLoading = useCallback((state: boolean) => {
    runHook("PostEditorSidebar_buildAllLoading", state);
    buildBusy.current = state;
  }, []);

  const setDeployLoading = useCallback((state: boolean) => {
    runHook("PostEditorSidebar_deployLoading", state);
    buildBusy.current = state;
  }, []);

  useEffect(() => {
    if (!title || !post.current) {
      return;
    }

    editorResizeFix();

    setHeaderLeftComponent(
      <Fragment>
        <div className="align-center">
          <i className="material-symbols-outlined">public</i>
          <a onClick={() => history.push(`/sites/${siteId}`)}>{title}</a>
        </div>
        <div className="align-center">
          <i className="material-symbols-outlined">keyboard_arrow_right</i>
          <a onClick={() => history.push(`/sites/${siteId}/posts`)}>Posts</a>
        </div>
        {post && (
          <div className="align-center">
            <i className="material-symbols-outlined">keyboard_arrow_right</i>
            <span>{truncateString(post.current.title, 30)}</span>
          </div>
        )}
      </Fragment>
    );
  }, [title, post]);

  const setStatusMessage = useCallback(debounce((type: string, message: string) => {
    const prefix = type === "error" ? "⭕" : "✅";
    postStatusRef.current.innerHTML = prefix + " " + message;

    if (statusMessageTimeout.current) {
      clearTimeout(statusMessageTimeout.current);
    }
    statusMessageTimeout.current = setTimeout(() => {
      if (postStatusRef.current) {
        postStatusRef.current.innerHTML = "";
      }
    }, 3000);
  }, 100), []);

  const startAutosave = () => {
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    autoSaveTimeout.current = setTimeout(async () => {
      if (editorContent.current && editorContent.current !== post.current.content && !isAIBusy && !document.querySelector(".editor-context-menu")) {
        await handleSave(true);
        post.current.content = editorContent.current;
      }
      startAutosave();
    }, 120000 /* 2 mins*/);
  };

  useEffect(() => {
    const getData = async () => {
      const siteRes = await getSite(siteId);
      const itemsRes = await getItems(siteId);
      const currentItem = itemsRes.find((item) => item.uuid === postId);

      items.current = itemsRes;
      post.current = currentItem;

      const { publishSuggested } = configGet(`sites.${siteId}`);
      setPublishSuggested(publishSuggested);
      editorContent.current = post.current.content || "";
      editorMode.current = post.current.isContentRaw ? "html" : "";

      setSite(siteRes);

      setHook("PostEditor_setIsAIBusy", (value: boolean) => {
        setIsAIBusy(value);
      });

      setHook("PostEditor_setStatusMessage", (params: string[]) => {
        setStatusMessage(...params);
      });

      setHook("PostEditor_handleSave", (value: boolean) => {
        handleSave(value);
      });
    };
    getData();
  }, []);

  useEffect(() => {
    if (itemIndex === -1) {
      return;
    }

    // Start autosave
    if (isAutosaveEnabled()) {
      startAutosave();
    }

    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    }
  }, [itemIndex]);

  const setLoadingStatus = useCallback((status) => {
    runHook("PostEditorSidebar_loadingStatus", status);
  }, []);

  const handleSave = async (isAutosave = false, buildAll = false) => {
    if (buildAll) {
      setBuildAllLoading(true);
    } else {
      setBuildLoading(true);
    }

    const prevContent = post.current?.content;

    if (editorMode.current === "html" && post && !post.current?.isContentRaw) {
      modal.alert(["error_save_text_editor", []]);
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
      const updatedItem = { ...post.current, content, updatedAt };
      const updatedSite = { ...site, updatedAt };

      /**
       *  Update item
       */
      await updateItem(siteId, postId, {
        content,
        updatedAt,
      });

      /**
       * Update site updatedAt
       */
      await updateSite(siteId, {
        updatedAt,
      });
      post.current = updatedItem;

      if (isAutosave) {
        setStatusMessage("success", `Post autosaved at <div class="badge badge-secondary">${new Date(post.current.updatedAt).toLocaleTimeString()}</div>`);
      } else {
        if (isPreviewActive()) {
          await buildPost(buildAll ? null : postId, setLoadingStatus);
          reloadPreview();

          if (buildAll) {
            setStatusMessage("success", "Post saved. The entire site has been rebuilt and the preview reloaded.");
          } else {
            setStatusMessage("success", "Post saved. The page has been rebuilt and the preview reloaded.");
          }
        } else {
          setStatusMessage("success", `Post saved at <div class="badge badge-secondary">${new Date(post.current.updatedAt).toLocaleTimeString()}</div>`);
        }
      }

      setEditorChanged(false);
      setSite(updatedSite);
    }

    if (buildAll) {
      setBuildAllLoading(false);
    } else {
      setBuildLoading(false);
    }
  };

  const handleSaveTitle = async (title, slug) => {
    const updatedAt = Date.now();
    const updatedItem = { ...post.current, title, updatedAt };
    updatedItem.slug = slug ? slug : updatedItem.slug;

    const itemSlug = slug ? slug : updatedItem.slug;

    /**
     *  Update item
     */
    await updateItem(siteId, postId, {
      title,
      slug: itemSlug,
      updatedAt,
    });

    post.current = updatedItem;

    configSet(`sites.${siteId}.publishSuggested`, true);
    setPublishSuggested(true);
    setStatusMessage("success", "Title saved");
  };

  const handleSaveSlug = async (slug, silent?: boolean) => {
    const updatedAt = Date.now();
    const updatedItem = { ...post.current, slug, updatedAt };

    /**
     *  Update item
     */
    await updateItem(siteId, postId, {
      slug,
      updatedAt,
    });

    post.current = updatedItem;

    configSet(`sites.${siteId}.publishSuggested`, true);
    setPublishSuggested(true);

    if (!silent) {
      setStatusMessage("success", "Slug saved");
    }
  };

  const changePostTemplate = async (template) => {
    if (!template || itemIndex === -1) return;
    const updatedItem = { ...post.current, template };
    const updatedAt = Date.now();

    /**
     *  Update item
     */
    await updateItem(siteId, postId, { template, updatedAt });
    post.current = updatedItem;

    configSet(`sites.${siteId}.publishSuggested`, true);
    setPublishSuggested(true);
    setStatusMessage("success", "Template changed successfully");
  };

  const toggleRawHTMLOnly = async () => {
    const isHTMLForced = !!post.current?.isContentRaw;
    const isContentRaw = !isHTMLForced;
    const updatedAt = Date.now();

    const updatedItem = { ...post.current, isContentRaw };

    /**
     *  Update item
     */
    await updateItem(siteId, postId, { isContentRaw, updatedAt });

    post.current = updatedItem;

    setStatusMessage("success", "Raw HTML content flag changed successfully. Refreshing.");

    if (isHTMLForced) {
      stopPreview();
      history.replace(`/sites/${siteId}/posts/editor`);
      history.replace(`/sites/${siteId}/posts/editor/${post.current?.uuid}`);
    }
  };

  const buildPost = async (postId = null, onUpdate = null) => {
    if (isPreviewActive()) {
      pausePreview();
    }
    await build(siteId, onUpdate, postId, postId ? true : false);
    if (isPreviewActive()) {
      resumePreview();
    }
  };

  const handleStartPreview = async () => {
    setPreviewLoading(true);

    if (editorMode.current === "html" && post && !post.current?.isContentRaw) {
      modal.alert(["error_preview_text_editor", []]);
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

    if (editorMode.current === "html" && post && !post.current?.isContentRaw) {
      modal.alert(["error_preview_text_editor", []]);
      setPreviewLoading(false);
      return;
    }

    stopPreview();
    setPreviewStarted(false);
    setPreviewLoading(false);
  };

  const handlePublish = async () => {
    if (!url) {
      setStatusMessage("error", "Site URL not defined! Please add one in your Site Settings");
      return;
    }

    if(post.current.template === "none"){
      setStatusMessage("error", "A post with 'none' template cannot be published");
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
      setStatusMessage("success", getString("publish_completed"));
    }

    if (typeof deployRes === "object") {
      if (deployRes.type === "redirect") {
        history.push(deployRes.value);
      }
    }

    configSet(`sites.${siteId}.publishSuggested`, false);
    setDeployLoading(false);
    setPublishSuggested(false);
  };

  const openRawHTMLOverlay = useCallback(() => {
    runHook("HTMLEditorOverlay_setVariables", {
      headHtml: post.current.headHtml,
      footerHtml: post.current.footerHtml,
      sidebarHtml: post.current.sidebarHtml
    });
  }, []);

  const openVariablesOverlay = useCallback(() => {
    runHook("SiteVariablesEditorOverlay_show");
  }, []);

  const handleVariablesOverlaySave = useCallback(async () => {
    runHook("SiteVariablesEditorOverlay_setIsLoading", true);

    // Save post
    await handleSave();

    runHook("SiteVariablesEditorOverlay_setIsLoading", false);
  }, []);

  const handleFeaturedImageSet = useCallback(() => {
    setStatusMessage("success", "Post updated");
  }, []);

  const onEditorKeyPress = (e: KeyboardEvent) => {
    if (e) {
      if (e.ctrlKey) {
        switch (e.key) {
          // ctrl+s: Save
          case "s":
            handleSave();
            break;

          // ctrl+p: Preview
          case "p":
            !buildBusy.current && (isPreviewActive() ?
              (() => {
                handleStopPreview();
                setStatusMessage("success", "Stopped Preview");

              })() : (() => {
                handleStartPreview();
                setStatusMessage("success", "Started Preview");
              })());
            break;

          default:
            break;
        }
      }
    }
  };

  const handleRawHTMLOverlaySave = useCallback(async (
    headHtml,
    footerHtml,
    sidebarHtml
  ) => {
    const updatedAt = Date.now();

    if (itemIndex > -1) {
      const updatedItem = {
        ...post.current,
        headHtml,
        footerHtml,
        sidebarHtml,
      };

      /**
       *  Update item
       */
      await updateItem(siteId, postId, {
        headHtml,
        footerHtml,
        sidebarHtml,
        updatedAt,
      });

      post.current = updatedItem;

      runHook("HTMLEditorOverlay_setIsLoading", true);

      // Save post
      await handleSave();

      runHook("HTMLEditorOverlay_setIsLoading", false);
    }
  }, [itemIndex, site]);

  if (!site || !items.current || !post.current) {
    return null;
  }

  return (
    <div className="PostEditor page">
      <h1>
        <div className="left-align">
          <i
            className="material-symbols-outlined clickable"
            onClick={() => history.goBack()}
          >
            arrow_back
          </i>
          {post ? (
            <TitleEditor
              siteId={siteId}
              postId={postId}
              initValue={post ? post.current?.title : null}
              onSave={handleSaveTitle}
            />
          ) : (
            <span>Post Editor</span>
          )}
        </div>
        <div className="right-align">
          {post && (
            <Fragment>
              <span className="slug-label mr-1">Slug:</span>
              <SlugEditor
                post={post.current}
                items={items.current}
                site={site}
                url={url}
                onSave={handleSaveSlug}
              />
            </Fragment>
          )}
        </div>
      </h1>
      <div className="content">
        <div className="editor-container">
          <div className="left-align">
            <Editor site={site} item={post.current} editorContent={editorContent} setEditorChanged={setEditorChanged} onKeyPress={onEditorKeyPress} />
          </div>
          <div className="right-align">
            <PostEditorSidebar
              site={site}
              item={post.current}
              forceRawHTMLEditing={post ? post.current?.isContentRaw : null}
              onSave={handleSave}
              onSaveRebuildAll={() => handleSave(false, true)}
              onStopPreview={handleStopPreview}
              onStartPreview={handleStartPreview}
              onPublish={handlePublish}
              onChangePostTemplate={changePostTemplate}
              onOpenRawHTMLOverlay={openRawHTMLOverlay}
              onOpenVarEditorOverlay={openVariablesOverlay}
              onToggleRawHTMLOnly={toggleRawHTMLOnly}
              onFeaturedImageSet={handleFeaturedImageSet}
            />
            {isAIBusy && (
              <div className="ai-sidebar mt-2">
                <span><b>🤖 PRSSAI</b> is performing an action. Please stay on the page while it completes.</span>
                <Loading small classNames="mr-1" />
              </div>
            )}
          </div>
        </div>
      </div>
      {post && (
        <Fragment>
          <HTMLEditorOverlay onSave={handleRawHTMLOverlaySave} />
          <SiteVariablesEditorOverlay site={site} post={post.current} onSave={handleVariablesOverlaySave} />
        </Fragment>
      )}
      <Footer
        rightComponent={<div ref={postStatusRef} className="post-status"></div>}
      />
    </div>
  );
};

export default PostEditor;
