import './styles/PostEditor.scss';

import React, {
    Fragment,
    FunctionComponent,
    useRef,
    useState,
    useEffect
} from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';

import { get, getString, set, getInt, setInt } from '../../common/utils';
import StandardEditor from './Editor';
import Footer from './Footer';
import Header from './Header';
import { modal } from './Modal';
import { toast } from 'react-toastify';
import {
    previewServer,
    stopPreview,
    bufferAndStartPreview
} from '../services/preview';
import { build } from '../services/build';
import { store } from '../../common/Store';
import { buildAndDeploy } from '../services/hosting';
import SlugEditor from './SlugEditor';
import TitleEditor from './TitleEditor';
import PostEditorSidebar from './PostEditorSidebar';
import HTMLEditorOverlay from './HTMLEditorOverlay';
import SiteVariablesEditorOverlay from './SiteVariablesEditorOverlay';

const PostEditor: FunctionComponent = () => {
    const { siteId, postId } = useParams();
    const [site, setSite] = useState(get(`sites.${siteId}`));
    const { title, url, items } = site;
    const { publishSuggested } = getInt(`sites.${siteId}`);
    const [post, setPost] = useState(
        postId ? items.find(item => item.id === postId) : null
    );
    const history = useHistory();
    const editorContent = useRef(post ? post.content : '');
    const editorMode = useRef(post && post.isContentRaw ? 'html' : '');
    const itemIndex = postId ? items.findIndex(item => item.id === postId) : -1;

    const editorChangedContent = useRef('');

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
    const [deployLoading, setDeployLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');

    // const autosaveInterval = useRef(null);
    // const autosaveMs = 600000; // 10 mins

    /**
     * Check for item changes
     */
    const unsubscribeWatchers = [];

    unsubscribeWatchers.push(
        store.onDidChange(`sites.${siteId}` as any, newValue => {
            setSite({ ...newValue });
        })
    );

    {
        post &&
            unsubscribeWatchers.push(
                store.onDidChange(
                    `sites.${siteId}.items.${itemIndex}` as any,
                    newValue => {
                        setPost({ ...newValue });
                    }
                )
            );
    }

    useEffect(
        () => () => {
            unsubscribeWatchers.forEach(unsubscribe => unsubscribe());
        },
        []
    );

    const handleSave = async (isAutosave = false) => {
        setBuildLoading(true);

        if (editorMode.current === 'html' && post && !post.isContentRaw) {
            modal.alert(getString('error_save_text_editor'));
            setBuildLoading(false);
            return;
        }

        const content = editorContent.current;
        const msTime = Date.now();

        if (itemIndex > -1) {
            const updatedItem = { ...post, content, updatedAt: msTime };

            /**
             *  Update items
             */
            set(`sites.${siteId}.items.${itemIndex}`, updatedItem);

            /**
             * Update site updatedAt
             */
            set(`sites.${siteId}.updatedAt`, msTime);

            if (isAutosave) {
                toast.success('Post autosaved');
            } else {
                if (previewServer.active) {
                    await buildPost(postId);
                    previewServer.reload();

                    toast.success(
                        'Post saved. The page has been rebuilt and the preview reloaded.'
                    );
                } else {
                    toast.success('Post saved!');
                }

                editorChangedContent.current = '';
                setEditorChanged(false);
            }
        }

        setBuildLoading(false);
    };

    const changePostTemplate = template => {
        if (!template || itemIndex === -1) return;
        set(`sites.${siteId}.items.${itemIndex}.template`, template);
        setInt(`sites.${siteId}.publishSuggested`, true);
        toast.success('Template changed successfully');
    };

    const toggleRawHTMLOnly = async () => {
        const isHTMLForced = !!post.isContentRaw;

        await set(
            `sites.${siteId}.items.${itemIndex}.isContentRaw`,
            !isHTMLForced
        );
        toast.success(
            'Raw HTML content flag changed successfully. Refreshing.'
        );

        if (isHTMLForced) {
            stopPreview();
            history.replace(`/sites/${siteId}/posts/editor`);
            history.replace(`/sites/${siteId}/posts/editor/${post.id}`);
        }
    };

    const buildPost = async postId => {
        if (previewServer.active) {
            previewServer.pause();
        }
        await build(siteId, null /*, postId*/); // Build all
        if (previewServer.active) {
            previewServer.resume();
        }
    };

    const handleStartPreview = async () => {
        setPreviewLoading(true);

        if (editorMode.current === 'html' && post && !post.isContentRaw) {
            modal.alert(getString('error_preview_text_editor'));
            setPreviewLoading(false);
            return;
        }

        const previewRes = await bufferAndStartPreview(site, postId);

        if (previewRes) {
            setPreviewStarted(true);
        }

        setPreviewLoading(false);
    };

    const handleStopPreview = () => {
        setPreviewLoading(true);

        if (editorMode.current === 'html' && post && !post.isContentRaw) {
            modal.alert(getString('error_preview_text_editor'));
            setPreviewLoading(false);
            return;
        }

        stopPreview();
        setPreviewStarted(false);
        setPreviewLoading(false);
    };

    const handlePublish = async () => {
        setDeployLoading(true);
        const curSite = get(`sites.${siteId}`);
        const curSiteInt = getInt(`sites.${siteId}`);

        const publishSuggested = curSiteInt.publishSuggested;

        const deployRes = await buildAndDeploy(
            curSite,
            setLoadingStatus,
            postId
        );

        if (deployRes) {
            toast.success(getString('publish_completed'));
        }

        if (typeof deployRes === 'object') {
            if (deployRes.type === 'redirect') {
                history.push(deployRes.value);
            }
        }

        if (publishSuggested) {
            setInt(`sites.${siteId}.publishSuggested`, false);
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
        if (itemIndex > -1) {
            await set(`sites.${siteId}.items.${itemIndex}.headHtml`, headHtml);
            await set(
                `sites.${siteId}.items.${itemIndex}.footerHtml`,
                footerHtml
            );
            await set(
                `sites.${siteId}.items.${itemIndex}.sidebarHtml`,
                sidebarHtml
            );
            toast.success('Post updated');
        }
    };

    return (
        <div className="PostEditor page fixed">
            <Header
                undertitle={
                    <Fragment>
                        <div className="align-center">
                            <i className="material-icons">public</i>
                            <Link to={`/sites/${siteId}`}>{title}</Link>
                        </div>
                        <div className="align-center">
                            <i className="material-icons">
                                keyboard_arrow_right
                            </i>
                            <Link to={`/sites/${siteId}/posts`}>Posts</Link>
                        </div>
                        {post && (
                            <div className="align-center">
                                <i className="material-icons">
                                    keyboard_arrow_right
                                </i>
                                <span>{post.title}</span>
                            </div>
                        )}
                    </Fragment>
                }
            />
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
                                postIndex={itemIndex}
                                initValue={post ? post.title : null}
                            />
                        ) : (
                            <span>Post Editor</span>
                        )}
                    </div>
                    <div className="right-align">
                        {post && (
                            <Fragment>
                                <span className="slug-label mr-1">
                                    Editing:
                                </span>
                                <SlugEditor
                                    siteId={siteId}
                                    postIndex={itemIndex}
                                    url={url}
                                    initValue={post ? post.slug : null}
                                />
                            </Fragment>
                        )}
                    </div>
                </h1>

                <div className="editor-container">
                    <div className="left-align">
                        <StandardEditor
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
                        />
                    </div>
                    <div className="right-align">
                        <PostEditorSidebar
                            site={site}
                            item={post}
                            previewStarted={previewStarted}
                            editorChanged={editorChanged}
                            previewLoading={previewLoading}
                            buildLoading={buildLoading}
                            deployLoading={deployLoading}
                            publishSuggested={publishSuggested}
                            loadingStatus={loadingStatus}
                            forceRawHTMLEditing={
                                post ? post.isContentRaw : null
                            }
                            onSave={handleSave}
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
            <Footer />
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
                            onClose={() =>
                                setShowSiteVariablesEditorOverlay(false)
                            }
                        />
                    )}
                </Fragment>
            )}
        </div>
    );
};

export default PostEditor;
